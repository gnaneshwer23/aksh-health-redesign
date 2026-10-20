/**
 * COMPASS loop outcomes: aggregates only. Small counts are suppressed, rates need enough decided drafts, no patient
 * label or id appears anywhere in the output, duplicates are counted once, and clinician decisions are counted right.
 */
import assert from "node:assert/strict";

process.env.ENABLE_DIABETES_MODULE = "true";

import { buildSpineReviewCase, draftPendingReferrals } from "../lib/clinical-spine/enqueue";
import { summariseLoopOutcomes, suppress } from "../lib/clinical-spine/loop-outcomes";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";
import type { ReviewCase } from "../lib/types";
import { decideReviewItem } from "../lib/workflow/decide-review-item";
import { resolveReviewQueueItems } from "../lib/workflow/review-queue";

async function run() {
  assert.equal(suppress(0), 0);
  assert.equal(suppress(3), "<5");
  assert.equal(suppress(5), 5);

  const recent = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const lab = (kind: string, value: number, unit: string) => ({ kind, value, unit, observedAt: recent, channel: "connector", code: null, corrected: false });
  const result = await runClinicalSpineOrchestrate({ patientId: "P002", includeDrAssist: true, includeTwinRanking: false, careNetwork: { glucoseReadings: [], hba1cReadings: [], labs: { egfr: lab("egfr", 25, "mL/min/{1.73_m2}") } as never } });

  const cases: ReviewCase[] = [];
  for (let n = 0; n < 6; n++) {
    let c = buildSpineReviewCase({ patientId: `PT-SECRET-${n}`, patientLabel: `Named Person ${n}`, result, userId: "u", now: new Date(Date.UTC(2026, 9, 20, 10, n)) });
    const items = resolveReviewQueueItems(c);
    const soap = items.find((i) => i.itemType === "soap_note")!;
    const codes = items.find((i) => i.itemType === "diagnosis_codes")!;
    // Five clinicians accept the note; one rejects it. All accept the codes.
    c = decideReviewItem(c, soap.id, n < 5 ? { action: "accept", expectedVersion: 0 } : { action: "reject", expectedVersion: 0, reason: "Not accurate" }, "dr@x").next;
    c = draftPendingReferrals(decideReviewItem(c, codes.id, { action: "accept", expectedVersion: 1 }, "dr@x").next);
    cases.push(c);
  }
  const out = summariseLoopOutcomes([...cases, cases[0]!]);
  assert.equal(out.runs, 6, "a duplicate case is counted once");
  const synthesis = out.agents.find((a) => a.agent === "SYNTHESIS")!;
  assert.equal(synthesis.drafts, 6);
  assert.equal(synthesis.accepted, 5);
  assert.equal(synthesis.rejected, "<5", "one rejection is suppressed");
  assert.equal(synthesis.rejectionRate, 0.17, "rate shown with 6 decided drafts");
  const ckd = out.referrals.find((r) => r.domain === "ckd")!;
  assert.equal(ckd.held, 6);
  assert.equal(ckd.drafted, 5, "referrals drafted only where the note and codes were accepted");
  assert.equal(ckd.confirmed, 0);
  const text = JSON.stringify(out);
  assert.ok(!/PT-SECRET|Named Person/.test(text), "no patient id or name in the aggregate");
  assert.ok(out.suppression.includes("<5"));

  const small = summariseLoopOutcomes(cases.slice(0, 2));
  assert.equal(small.runs, "<5");
  assert.ok(small.agents.every((a) => a.rejectionRate === null), "no rates from fewer than 5 decided drafts");
  console.log("loop-outcomes: aggregates only, small counts suppressed, rates need 5, duplicates once, decisions and referrals counted — PASS");
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
