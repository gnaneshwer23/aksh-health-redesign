/**
 * Case-level and human-gate decisions are made on the server (P0 remainder): version check, acknowledgement, every
 * blocker and required gate re-checked, the signed-in identity recorded, accepted cases final, and the audit row stored
 * with the case. Pure checks on the seed cases, then the DB part on the simulation database (USE_POSTGRES=true).
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { deriveHumanGates } from "../lib/human-gates";
import { reviewCases as seeds } from "../lib/mock-data";
import { persistItemDecision } from "../lib/repositories/review-decision-repository";
import { readReviewCases } from "../lib/review-case-repository";
import type { ReviewCase } from "../lib/types";
import { CaseDecisionError, caseAcceptanceBlockers, decideHumanGate, decideReviewCase, parseCaseDecision, parseGateDecision } from "../lib/workflow/decide-review-case";

const is = (code: string) => (e: unknown) => e instanceof CaseDecisionError && e.code === code;
const seed = (id: string) => seeds.find((c) => c.id === id)!;

function pure() {
  assert.throws(() => parseCaseDecision({ decision: "approve", expectedVersion: 0 }), is("INVALID"));
  assert.throws(() => parseCaseDecision({ decision: "accept" }), is("INVALID"), "expectedVersion is required");
  assert.throws(() => parseGateDecision("not_a_gate", { status: "confirmed", expectedVersion: 0 }), is("INVALID"));
  assert.throws(() => parseGateDecision("medication_decision", { status: "done", expectedVersion: 0 }), is("INVALID"));

  // A case with no blockers: acknowledgement required, then accepted under the server identity, frozen and final.
  const clean = seed("case-003");
  assert.equal(caseAcceptanceBlockers(clean).length, 0);
  assert.throws(() => decideReviewCase(clean, { decision: "accept", expectedVersion: 0, acknowledged: false }, "dr@x"), is("ACKNOWLEDGEMENT_REQUIRED"));
  assert.throws(() => decideReviewCase(clean, { decision: "accept", expectedVersion: 4, acknowledged: true }, "dr@x"), is("STALE_CASE"));
  const accepted = decideReviewCase(clean, { decision: "accept", expectedVersion: 0, acknowledged: true, notes: "Reviewed" }, "dr@x");
  assert.equal(accepted.next.status, "accepted");
  assert.equal(accepted.next.version, 1);
  assert.equal(accepted.outcome.decidedBy, "dr@x");
  assert.equal(accepted.next.reviewSummary?.lastReviewer, "dr@x", "the signed-in identity, never a typed name");
  assert.ok(accepted.next.frozenArtifact, "evidence frozen on accept");
  assert.ok(accepted.next.auditEvents.some((e) => e.category === "reviewer_decision" && e.actor === "dr@x"));
  assert.equal(accepted.audit.action, "accept");
  assert.throws(() => decideReviewCase(accepted.next, { decision: "reject", expectedVersion: 1, acknowledged: false }, "b@x"), is("CASE_FINAL"));
  assert.throws(() => decideHumanGate(accepted.next, { gateId: "medication_decision", status: "confirmed", expectedVersion: 1 }, "b@x"), is("CASE_FINAL"));

  // A required medication gate blocks acceptance until a clinician decides it on the server.
  const gated = seed("case-008");
  assert.equal(deriveHumanGates(gated).find((g) => g.id === "medication_decision")!.status, "required");
  assert.throws(() => decideReviewCase(gated, { decision: "accept", expectedVersion: 0, acknowledged: true }, "dr@x"), (e: unknown) => e instanceof CaseDecisionError && e.code === "BLOCKED" && e.blockers.some((b) => /requires an explicit reviewer decision/.test(b)));
  const gate = decideHumanGate(gated, { gateId: "medication_decision", status: "confirmed", note: "Pharmacist reviewed", expectedVersion: 0 }, "rx@x");
  assert.equal(gate.next.humanGateDecisions!.find((d) => d.id === "medication_decision")!.decidedBy, "rx@x");
  assert.equal(deriveHumanGates(gate.next).find((g) => g.id === "medication_decision")!.status, "completed");
  assert.equal(gate.next.version, 1);
  assert.ok(!caseAcceptanceBlockers(gate.next).some((b) => /Medication/i.test(b) && /requires an explicit reviewer decision/.test(b)), "the gate no longer blocks");

  // A gate that does not apply cannot be "decided".
  assert.throws(() => decideHumanGate(seed("case-007"), { gateId: "red_flag_escalation", status: "confirmed", expectedVersion: 0 }, "dr@x"), is("GATE_NOT_APPLICABLE"));

  // Reject and defer are allowed with open blockers (they do not release anything).
  const risky = seed("case-001");
  assert.ok(caseAcceptanceBlockers(risky).length > 0);
  assert.equal(decideReviewCase(risky, { decision: "reject", expectedVersion: 0, acknowledged: false, notes: "Unsafe draft" }, "dr@x").next.status, "rejected");
  assert.equal(decideReviewCase(risky, { decision: "defer", expectedVersion: 0, acknowledged: false }, "dr@x").next.status, "deferred");
  assert.equal(decideReviewCase(risky, { decision: "reject", expectedVersion: 0, acknowledged: false }, "dr@x").next.frozenArtifact, risky.frozenArtifact, "only accept freezes evidence");
  console.log("review-case-decision: validation, acknowledgement, blockers and gates, server identity, final after accept — PASS");
}

async function db() {
  if (!isPostgresConfigured() || process.env.USE_POSTGRES !== "true") return console.log("review-case-decision: DB part skipped (needs USE_POSTGRES=true)");
  await assertNotProductionDatabase(getPgPool(), "case decision test");
  const scope = `cd-${randomUUID().slice(0, 8)}`;
  const practice = "practice-demo";
  try {
    const stored = (await readReviewCases(scope, practice)).find((c) => c.id === "case-008") as ReviewCase;
    const v = stored.version ?? 0;
    const gate = decideHumanGate(stored, { gateId: "medication_decision", status: "confirmed", expectedVersion: v }, "rx.test@aksh.test");
    const savedGate = await persistItemDecision({ next: gate.next, expectedVersion: v, scopeKey: scope, practiceId: practice, userId: stored.userId || "anonymous", audit: gate.audit });
    const row = (await getPgPool().query(`SELECT case_id, action, actor FROM aksh.shield_audit_events WHERE id = $1`, [savedGate.auditId])).rows[0];
    assert.deepEqual(row, { case_id: "case-008", action: "gate_decision", actor: "rx.test@aksh.test" });
    const after = (await readReviewCases(scope, practice)).find((c) => c.id === "case-008")!;
    assert.equal(after.version, v + 1);
    assert.equal(after.humanGateDecisions!.find((d) => d.id === "medication_decision")!.decidedBy, "rx.test@aksh.test");
    // Working from the old version is refused.
    await assert.rejects(persistItemDecision({ next: gate.next, expectedVersion: v, scopeKey: scope, practiceId: practice, userId: stored.userId || "anonymous", audit: gate.audit }), /STALE_CASE/);
  } finally {
    await getPgPool().query(`DELETE FROM aksh.review_cases WHERE scope_key = $1`, [scope]);
  }
  console.log("review-case-decision: gate decision stored with its audit row, version advanced, stale refused — PASS");
}

pure();
db()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
