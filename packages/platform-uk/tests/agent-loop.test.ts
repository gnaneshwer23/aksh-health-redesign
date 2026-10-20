/**
 * The agent loop with the clinician in it (Volume I FLOW-JRN-1): a CONDUCTOR run on a diabetes patient whose kidney
 * results indicate a referral becomes review drafts in CONDUCTOR's review order; nothing about the referral exists until
 * the clinician accepts the note and the codes; then PATHWAY drafts it; the case can be accepted only once every draft
 * and gate is decided. Simulation; pure (no database).
 */
import assert from "node:assert/strict";

process.env.ENABLE_DIABETES_MODULE = "true";

import { buildSpineReviewCase, draftPendingReferrals } from "../lib/clinical-spine/enqueue";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import { resolveReviewQueueItems } from "../lib/workflow/review-queue";
import { decideReviewItem } from "../lib/workflow/decide-review-item";

async function run() {
  const recent = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const lab = (kind: string, value: number, unit: string) => ({ kind, value, unit, observedAt: recent, channel: "connector", code: null, corrected: false, provenance: "observed" as const });
  const result = await runClinicalSpineOrchestrate({
    patientId: "P002",
    includeDrAssist: true,
    careNetwork: { glucoseReadings: [], hba1cReadings: [{ recordedAt: recent, valueMmolMol: 68 }], labs: { egfr: lab("egfr", 25, "mL/min/{1.73_m2}"), acr: lab("acr", 12, "mg/mmol"), ldl: lab("ldl", 3.4, "mmol/L") } as never },
  });
  assert.equal(result.ehrWrite, false);
  assert.equal(result.hitlRequired, true);
  assert.ok(result.diabetes, "Aksh Diabetes ran for a diabetes patient");
  const ckd = result.diabetes!.signals.complications.find((c) => c.domain === "ckd")!;
  assert.equal(ckd.flagLevel, "referral_indicated");
  assert.equal(ckd.basis, "laboratory");

  // Drafts enter the review queue in CONDUCTOR's review order, labelled as AI drafts.
  const reviewCase = buildSpineReviewCase({ patientId: "P002", patientLabel: "Synthetic P002", result, userId: "u-1", now: new Date("2026-10-20T10:00:00Z") });
  const items = resolveReviewQueueItems(reviewCase);
  const itemAgents: string[] = items.map((i) => i.agentId);
  assert.deepEqual(itemAgents, result.orchestration.reviewOrder.filter((a) => itemAgents.includes(a)), "items follow the review order");
  assert.ok(items.every((i) => i.status === "DRAFT" && i.metadata?.provenance === "ai_draft"));
  assert.ok(items.some((i) => i.itemType === "soap_note") && items.some((i) => i.itemType === "diagnosis_codes"));
  assert.equal(reviewCase.agentRun!.pendingReferrals[0]!.domain, "ckd");
  assert.ok(reviewCase.agentRun!.pendingReferrals[0]!.ruleIds.includes("kidney.egfr_below_30"));
  assert.equal(items.some((i) => i.itemType === "referral_package"), false, "no referral before the assessment is accepted");
  assert.equal(draftPendingReferrals(reviewCase), reviewCase, "nothing to draft yet");

  // Clinician accepts the note: still no referral. Then the codes: PATHWAY drafts the kidney referral.
  const soap = items.find((i) => i.itemType === "soap_note")!;
  const codes = items.find((i) => i.itemType === "diagnosis_codes")!;
  const afterSoap = draftPendingReferrals(decideReviewItem(reviewCase, soap.id, { action: "accept", expectedVersion: 0 }, "dr@x").next);
  assert.equal(resolveReviewQueueItems(afterSoap).some((i) => i.itemType === "referral_package"), false);
  const afterCodes = draftPendingReferrals(decideReviewItem(afterSoap, codes.id, { action: "accept", expectedVersion: 1 }, "dr@x").next);
  const referral = resolveReviewQueueItems(afterCodes).find((i) => i.itemType === "referral_package")!;
  assert.ok(referral, "PATHWAY drafts the referral after the note and codes are accepted");
  assert.equal(referral.status, "DRAFT", "the referral itself still needs a clinician");
  assert.match(referral.content ?? "", /eGFR 25/);
  assert.equal(draftPendingReferrals(afterCodes), afterCodes, "drafting is idempotent");

  console.log(`agent-loop: run → ${items.length} drafts in review order → clinician accepts note and codes → PATHWAY referral draft (ckd, eGFR 25) — PASS`);
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
