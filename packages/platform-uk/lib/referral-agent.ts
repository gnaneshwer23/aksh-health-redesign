import { CLINICAL_AGENT_META } from "./agents";
import type { ReviewCase, ReviewQueueItem, ServiceRequestResource } from "./types";

export const PATEL_REFERRAL_TRANSCRIPT =
  "Urgent DVT pathway: duplex ultrasound lower limb and D-dimer within 24 hours. Wells score moderate. Right calf swelling with prior DVT history.";

/** Side from the case's own condition text; never assumed (Patel P002 is right, case-v-uk1 is left). */
function limbSide(reviewCase: ReviewCase): "left" | "right" | null {
  const text = [reviewCase.draft?.condition?.codeText, reviewCase.summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const left = /\bleft\b/.test(text);
  const right = /\bright\b/.test(text);
  if (left === right) return null;
  return left ? "left" : "right";
}

export function buildReferralQueueItem(reviewCase: ReviewCase): ReviewQueueItem {
  const side = limbSide(reviewCase);
  const limb = side ? `${side} lower limb` : "lower limb, side to confirm";
  const calf = side ? `${side} calf` : "calf (side to confirm)";
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
      `Requested: Duplex ultrasound (${limb}) + D-dimer`,
      `Clinical indication: Suspected DVT: ${calf} swelling × 5 days, Wells moderate`,
      "Supporting codes: SNOMED CT 128053003, 44054006 (ICD-10 I80.2, E11.9)",
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
        detail: `Triggered after SYNTHESIS SOAP and ${CLINICAL_AGENT_META.DrASSIST.label} codes accepted: synthetic only`
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
