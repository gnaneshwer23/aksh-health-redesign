import type { ReviewCase, ReviewQueueItem, ServiceRequestResource } from "./types";

export const PATEL_REFERRAL_TRANSCRIPT =
  "Urgent DVT pathway: duplex ultrasound lower limb and D-dimer within 24 hours. Wells score moderate. Left calf swelling with prior DVT history.";

export function buildReferralQueueItem(reviewCase: ReviewCase): ReviewQueueItem {
  return {
    id: `${reviewCase.id}-queue-referral`,
    agentId: "REFERRAL",
    itemType: "referral_package",
    status: "DRAFT",
    title: "DVT urgent referral package",
    summary: "Duplex ultrasound + D-dimer: urgent pathway (synthetic e-referral draft)",
    content: [
      "REFERRAL AGENT: coordination draft",
      "Priority: URGENT",
      "Requested: Duplex ultrasound (left lower limb) + D-dimer",
      "Clinical indication: Suspected DVT: left calf swelling × 5 days, Wells moderate",
      "Supporting codes: I82.4, E11.65",
      "Status: DRAFT | GP Accept required before ServiceRequest write-back"
    ].join("\n"),
    metadata: {
      priority: "urgent",
      pathway: "vascular_imaging",
      investigations: ["duplex_ultrasound", "d_dimer"]
    }
  };
}

export function buildServiceRequestStub(reviewCase: ReviewCase): ServiceRequestResource {
  return {
    resourceType: "ServiceRequest",
    id: `servicereq-${reviewCase.id}`,
    codeText: "Duplex ultrasound lower limb + D-dimer",
    status: "draft",
    priority: "urgent",
    reason: "Suspected DVT | urgent imaging per referral package",
    performerText: "Regional vascular diagnostics (synthetic)"
  };
}

export function soapAndCodesAccepted(items: ReviewQueueItem[]) {
  const soap = items.find((item) => item.itemType === "soap_note");
  const codes = items.find((item) => item.itemType === "diagnosis_codes");
  return soap?.status === "ACCEPTED" && codes?.status === "ACCEPTED";
}

export function hasReferralQueueItem(items: ReviewQueueItem[]) {
  return items.some((item) => item.itemType === "referral_package");
}

/** After SOAP + DrASSIST codes are accepted, stage REFERRAL AGENT package. */
export function maybeStageReferralPackage(reviewCase: ReviewCase, items: ReviewQueueItem[]): ReviewCase {
  if (!soapAndCodesAccepted(items) || hasReferralQueueItem(items)) {
    return reviewCase;
  }

  const referralItem = buildReferralQueueItem(reviewCase);
  return {
    ...reviewCase,
    reviewQueueItems: [...items, referralItem],
    auditEvents: [
      ...reviewCase.auditEvents,
      {
        id: `evt-referral-${Date.now()}`,
        category: "system",
        label: "REFERRAL AGENT: urgent DVT package staged",
        actor: "system",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        detail: "Triggered after SYNTHESIS SOAP and DrASSIST codes accepted: synthetic only"
      }
    ]
  };
}

/** On referral Accept, attach ServiceRequest stub for evidence export. */
export function applyReferralAccept(reviewCase: ReviewCase): ReviewCase {
  return {
    ...reviewCase,
    serviceRequestDraft: buildServiceRequestStub(reviewCase)
  };
}
