/**
 * Reviewer decisions are made and stored on the server (brief §7): version check, valid transitions, reason and text
 * rules, the audit record in the same transaction, and a full rollback when the audit write fails. Pure checks first;
 * the DB part runs on the simulation database (USE_POSTGRES=true) and skips without it.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { persistItemDecision } from "../lib/repositories/review-decision-repository";
import { reviewCases as seedCases } from "../lib/mock-data";
import { readReviewCases } from "../lib/review-case-repository";
import type { ReviewCase } from "../lib/types";
import { DecisionError, decideReviewItem, parseItemDecision } from "../lib/workflow/decide-review-item";
import { resolveReviewQueueItems } from "../lib/workflow/review-queue";

const is = (code: string) => (e: unknown) => e instanceof DecisionError && e.code === code;

function pure(seed: ReviewCase) {
  const item = resolveReviewQueueItems(seed).find((i) => i.status === "DRAFT")!;
  assert.throws(() => parseItemDecision({ action: "approve", expectedVersion: 0 }), is("INVALID"));
  assert.throws(() => parseItemDecision({ action: "accept" }), is("INVALID"), "expectedVersion is required");
  assert.throws(() => decideReviewItem(seed, item.id, { action: "accept", expectedVersion: 7 }, "a@x"), is("STALE_CASE"));
  assert.throws(() => decideReviewItem(seed, "nope", { action: "accept", expectedVersion: 0 }, "a@x"), is("ITEM_NOT_FOUND"));
  assert.throws(() => decideReviewItem(seed, item.id, { action: "reject", expectedVersion: 0, reason: " " }, "a@x"), is("REASON_REQUIRED"));
  assert.throws(() => decideReviewItem(seed, item.id, { action: "edit", expectedVersion: 0, content: "" }, "a@x"), is("CONTENT_REQUIRED"));
  const edited = decideReviewItem(seed, item.id, { action: "edit", expectedVersion: 0, content: "Clinician wording" }, "dr@x");
  const e = resolveReviewQueueItems(edited.next).find((i) => i.id === item.id)!;
  assert.equal(e.content, "Clinician wording");
  assert.equal(e.originalContent, item.content ?? "", "the generated draft is kept beside the edit");
  assert.equal(e.status, "DRAFT", "an edit stays a draft until accepted");
  assert.equal(edited.next.version, 1);
  const accepted = decideReviewItem(edited.next, item.id, { action: "accept", expectedVersion: 1 }, "dr@x");
  assert.equal(accepted.outcome.status, "ACCEPTED");
  assert.equal(accepted.outcome.decidedBy, "dr@x", "the server identity, never a typed name");
  assert.throws(() => decideReviewItem(accepted.next, item.id, { action: "reject", expectedVersion: 2, reason: "late" }, "b@x"), is("ALREADY_DECIDED"));
  console.log("review-decision: validation, transitions, edit keeps original, server identity — PASS");
}

async function db() {
  if (!isPostgresConfigured() || process.env.USE_POSTGRES !== "true") return console.log("review-decision: DB part skipped (needs USE_POSTGRES=true)");
  await assertNotProductionDatabase(getPgPool(), "review decision test");
  const scope = `rd-${randomUUID().slice(0, 8)}`;
  const practice = "practice-demo";
  const seed = (await readReviewCases(scope, practice))[0]!;
  const item = resolveReviewQueueItems(seed).find((i) => i.status === "DRAFT")!;

  const first = decideReviewItem(seed, item.id, { action: "accept", expectedVersion: 0 }, "dr.test@aksh.test");
  const saved = await persistItemDecision({ next: first.next, expectedVersion: 0, scopeKey: scope, practiceId: practice, userId: seed.userId || "anonymous", audit: first.audit });
  assert.equal(saved.auditDurable, true);
  const audit = await getPgPool().query(`SELECT case_id, queue_item_id, action, actor FROM aksh.shield_audit_events WHERE id = $1`, [saved.auditId]);
  assert.deepEqual(audit.rows[0], { case_id: seed.id, queue_item_id: item.id, action: "accept", actor: "dr.test@aksh.test" });
  const stored = (await readReviewCases(scope, practice)).find((c) => c.id === seed.id)!;
  assert.equal(stored.version, 1);
  assert.equal(resolveReviewQueueItems(stored).find((i) => i.id === item.id)!.status, "ACCEPTED");

  // A second reviewer working from the old version cannot overwrite it.
  await assert.rejects(persistItemDecision({ next: first.next, expectedVersion: 0, scopeKey: scope, practiceId: practice, userId: seed.userId || "anonymous", audit: first.audit }), is("STALE_CASE"));

  // If the audit record cannot be written, the decision is not saved either.
  const other = resolveReviewQueueItems(stored).find((i) => i.status === "DRAFT");
  if (other) {
    const fn = `aksh.test_audit_fault_${scope.replace(/-/g, "_")}`;
    await getPgPool().query(`CREATE FUNCTION ${fn}() RETURNS trigger LANGUAGE plpgsql AS $f$ BEGIN RAISE EXCEPTION 'injected audit fault'; END $f$`);
    try {
      await getPgPool().query(`CREATE TRIGGER ${fn.split(".")[1]} BEFORE INSERT ON aksh.shield_audit_events FOR EACH ROW WHEN (NEW.case_id = '${seed.id}' AND NEW.queue_item_id = '${other.id}') EXECUTE FUNCTION ${fn}()`);
      const d = decideReviewItem(stored, other.id, { action: "reject", expectedVersion: 1, reason: "Not indicated" }, "dr.test@aksh.test");
      await assert.rejects(persistItemDecision({ next: d.next, expectedVersion: 1, scopeKey: scope, practiceId: practice, userId: seed.userId || "anonymous", audit: d.audit }), /injected audit fault/);
      const after = (await readReviewCases(scope, practice)).find((c) => c.id === seed.id)!;
      assert.equal(after.version, 1, "no decision without its audit record");
      assert.equal(resolveReviewQueueItems(after).find((i) => i.id === other.id)!.status, "DRAFT");
    } finally {
      await getPgPool().query(`DROP TRIGGER IF EXISTS ${fn.split(".")[1]} ON aksh.shield_audit_events`);
      await getPgPool().query(`DROP FUNCTION IF EXISTS ${fn}()`);
    }
  }
  await getPgPool().query(`DELETE FROM aksh.review_cases WHERE scope_key = $1`, [scope]);
  console.log("review-decision: stored decision, audit in the same transaction, stale version refused, audit failure rolls back — PASS");
}

(async () => {
  pure(seedCases[0]!);
  await db();
})().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => closePgPool());
