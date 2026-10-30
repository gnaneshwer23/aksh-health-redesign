/**
 * P1-LAB-01 — deterministic lab order drafts from `missingLabs` (HITL only).
 * Mirrors PATHWAY referral packaging: stage after note + codes Accept; attach
 * ServiceRequest stub(s) only when the clinician Accepts the lab draft.
 * Never writes to a live EHR / lab vendor.
 */
import { CLINICAL_AGENT_META } from "./agents";
import type { ReviewCase, ReviewQueueItem, ServiceRequestResource } from "./types";

const lines = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join("\n");

export function soapAndCodesAccepted(items: ReviewQueueItem[]) {
  const soap = items.find((item) => item.itemType === "soap_note");
  const codes = items.find((item) => item.itemType === "diagnosis_codes");
  return soap?.status === "ACCEPTED" && codes?.status === "ACCEPTED";
}

export function hasLabOrderQueueItem(items: ReviewQueueItem[]) {
  return items.some((item) => item.itemType === "lab_order");
}

/** One HITL queue item listing all missing-lab advisories for clinician confirmation. */
export function buildLabOrderQueueItem(reviewCase: ReviewCase, missingLabs: string[]): ReviewQueueItem {
  const labs = [...new Set(missingLabs.map((l) => l.trim()).filter(Boolean))];
  return {
    id: `${reviewCase.id}-queue-lab-order`,
    agentId: "REFERRAL",
    itemType: "lab_order",
    status: "DRAFT",
    title: "Lab order draft (HITL)",
    summary: `${labs.length} investigation(s) suggested from missing-lab signals — clinician Confirm required`,
    content: lines(
      "PATHWAY-like packaging: lab order draft",
      "Priority: ROUTINE",
      "Requested investigations:",
      ...labs.map((l) => `• ${l}`),
      "Status: DRAFT | GP Accept required before ServiceRequest staging",
      "ehrWrite: false · no live lab vendor · no EMR write-back"
    ),
    metadata: {
      agent: "PATHWAY",
      provenance: "ai_draft",
      pathway: "lab_investigations",
      investigations: labs,
      ehrWrite: "false",
    },
  };
}

export function buildLabServiceRequestStubs(
  reviewCase: ReviewCase,
  missingLabs: string[]
): ServiceRequestResource[] {
  const labs = [...new Set(missingLabs.map((l) => l.trim()).filter(Boolean))];
  if (!labs.length) return [];
  return labs.map((lab, i) => ({
    resourceType: "ServiceRequest",
    id: `servicereq-lab-${reviewCase.id}-${i + 1}`,
    codeText: lab,
    status: "draft",
    priority: "routine",
    reason: `Missing-lab advisory accepted under HITL · case ${reviewCase.id}`,
    performerText: "Practice pathology / local lab (synthetic staging only)",
  }));
}

/**
 * After SOAP + codes Accept on an agent-run case with missingLabs, stage one lab_order draft.
 * Idempotent; no-op when labs already staged or none missing.
 */
export function maybeStageLabOrderPackage(reviewCase: ReviewCase, items: ReviewQueueItem[]): ReviewCase {
  const missing = reviewCase.agentRun?.missingLabs ?? [];
  if (!missing.length || !soapAndCodesAccepted(items) || hasLabOrderQueueItem(items)) {
    return reviewCase;
  }

  const labItem = buildLabOrderQueueItem(reviewCase, missing);
  return {
    ...reviewCase,
    reviewQueueItems: [...items, labItem],
    auditEvents: [
      ...reviewCase.auditEvents,
      {
        id: `evt-lab-${Date.now()}`,
        category: "system",
        label: "SHIELD: lab order draft staged (HITL)",
        actor: "system",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        detail: `Triggered after SYNTHESIS SOAP and ${CLINICAL_AGENT_META.DrASSIST.label} codes accepted; ${missing.length} missing-lab signal(s); synthetic only`,
      },
    ],
  };
}

/** On lab_order Accept, attach draft ServiceRequest stubs for evidence export (never active / live). */
export function applyLabOrderAccept(reviewCase: ReviewCase): ReviewCase {
  const item = (reviewCase.reviewQueueItems ?? []).find((i) => i.itemType === "lab_order");
  const fromMeta = item?.metadata?.investigations;
  const labs =
    Array.isArray(fromMeta) && fromMeta.every((x) => typeof x === "string")
      ? (fromMeta as string[])
      : (reviewCase.agentRun?.missingLabs ?? []);
  const stubs = buildLabServiceRequestStubs(reviewCase, labs);
  if (!stubs.length) return reviewCase;
  return {
    ...reviewCase,
    labServiceRequestDrafts: stubs,
    // Keep first stub on legacy singular field for exporters that only read serviceRequestDraft
    // when no referral ServiceRequest already occupies it.
    serviceRequestDraft: reviewCase.serviceRequestDraft ?? stubs[0],
    auditEvents: [
      ...reviewCase.auditEvents,
      {
        id: `evt-lab-accept-${Date.now()}`,
        category: "system",
        label: "SHIELD: lab order draft (HITL)",
        actor: "system",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        detail: `${stubs.length} ServiceRequest draft(s) staged · ehrWrite:false · no connector side effects`,
      },
    ],
  };
}

/** Spine helper: stage pending lab drafts after note+codes (alongside PATHWAY referrals). */
export function draftPendingLabOrders(reviewCase: ReviewCase): ReviewCase {
  return maybeStageLabOrderPackage(reviewCase, reviewCase.reviewQueueItems ?? []);
}
