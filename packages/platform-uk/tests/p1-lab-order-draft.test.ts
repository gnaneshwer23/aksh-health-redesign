/**
 * P1-LAB-01 — Accept → lab order draft (HITL ServiceRequest stubs; no connector).
 */
import assert from "node:assert/strict";

import {
  applyLabOrderAccept,
  buildLabOrderQueueItem,
  draftPendingLabOrders,
  maybeStageLabOrderPackage,
} from "../lib/lab-order-agent";
import { updateQueueItemDecision } from "../lib/workflow/review-queue";
import type { ReviewCase, ReviewQueueItem } from "../lib/types";

function baseCase(overrides: Partial<ReviewCase> = {}): ReviewCase {
  const items: ReviewQueueItem[] = [
    {
      id: "c-soap",
      agentId: "SYNTHESIS",
      itemType: "soap_note",
      status: "DRAFT",
      title: "SOAP",
      summary: "note",
      content: "S/O/A/P",
    },
    {
      id: "c-codes",
      agentId: "DrASSIST",
      itemType: "diagnosis_codes",
      status: "DRAFT",
      title: "Codes",
      summary: "codes",
      content: "E11.9",
    },
  ];
  return {
    id: "case-lab-p1",
    version: 0,
    userId: "user-lab-p1",
    status: "in_review",
    patientLabel: "Synthetic P002",
    patientId: "P002",
    updatedAt: "12:00",
    summary: "lab draft test",
    reviewQueueItems: items,
    agentRun: {
      source: "clinical_spine",
      ranAt: new Date().toISOString(),
      queuePriority: "Normal",
      reviewOrder: ["SYNTHESIS", "GUARDIAN", "ORACLE", "DrASSIST"],
      safetyRoute: "standard",
      ruleVersion: "test",
      pendingReferrals: [],
      missingLabs: ["eGFR out of date (>12 months)", "ACR not on record"],
      correlations: [],
      modelUsed: false,
    },
    input: { rawText: "synthetic", sourceType: "note" },
    safetyContext: { flags: [], allergies: [], medications: [] },
    draft: { resources: [] },
    auditEvents: [],
    ...overrides,
  } as ReviewCase;
}

const staged = (() => {
  let c = baseCase();
  c = updateQueueItemDecision(c, "c-soap", "ACCEPTED", { decidedBy: "gp@test" });
  c = updateQueueItemDecision(c, "c-codes", "ACCEPTED", { decidedBy: "gp@test" });
  return c;
})();

assert.ok(
  staged.reviewQueueItems?.some((i) => i.itemType === "lab_order"),
  "lab_order draft staged after note+codes Accept"
);

const lab = staged.reviewQueueItems!.find((i) => i.itemType === "lab_order")!;
assert.equal(lab.status, "DRAFT");
assert.match(lab.content ?? "", /ehrWrite: false/);
assert.ok(Array.isArray(lab.metadata?.investigations));

const accepted = updateQueueItemDecision(staged, lab.id, "ACCEPTED", { decidedBy: "gp@test" });
assert.ok(accepted.labServiceRequestDrafts?.length === 2, "two ServiceRequest drafts");
assert.equal(accepted.labServiceRequestDrafts![0]!.status, "draft");
assert.ok(
  accepted.auditEvents.some((e) => e.label.includes("lab order draft")),
  "SHIELD-style audit on accept"
);

// Idempotent staging
const again = draftPendingLabOrders(accepted);
assert.equal(
  again.reviewQueueItems!.filter((i) => i.itemType === "lab_order").length,
  1,
  "idempotent"
);

// Pure helpers
const bare = baseCase();
const item = buildLabOrderQueueItem(bare, bare.agentRun!.missingLabs);
assert.equal(item.itemType, "lab_order");
const notYet = maybeStageLabOrderPackage(bare, bare.reviewQueueItems!);
assert.equal(notYet, bare, "no stage before soap+codes");
const afterAcceptOnly = applyLabOrderAccept({
  ...bare,
  reviewQueueItems: [{ ...item, status: "ACCEPTED" }],
});
assert.ok((afterAcceptOnly.labServiceRequestDrafts?.length ?? 0) >= 1);

console.log("p1-lab-order-draft: HITL lab draft + ServiceRequest stubs, no live write — PASS");
