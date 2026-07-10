import { formatCaseTimestamp } from "./time-format";
import type { AuditEvent, FhirAuditEventResource, ReviewCase, ReviewQueueItem, ReviewQueueItemStatus } from "./types";

export type ShieldAction = "accept" | "edit" | "reject" | "defer";

export function createShieldAuditEvent({
  action,
  actor,
  detail,
  queueItemId,
  agentLabel
}: {
  action: ShieldAction;
  actor: string;
  detail: string;
  queueItemId?: string;
  agentLabel?: string;
}): AuditEvent {
  const actionLabel =
    action === "accept"
      ? "SHIELD: queue item accepted"
      : action === "reject"
        ? "SHIELD: queue item rejected"
        : action === "edit"
          ? "SHIELD: queue item edited"
          : "SHIELD: reviewer action deferred";

  return {
    id: `shield-${Math.random().toString(36).slice(2, 10)}`,
    category: "reviewer_decision",
    label: actionLabel,
    actor: "SHIELD",
    timestamp: formatCaseTimestamp(),
    detail: [agentLabel ? `Agent: ${agentLabel}` : null, queueItemId ? `Item: ${queueItemId}` : null, `Reviewer: ${actor}`, detail]
      .filter(Boolean)
      .join(" · ")
  };
}

export function createFhirShieldAuditEvent({
  action,
  actor,
  caseId,
  detail,
  queueItemId,
  agentLabel,
  practiceId
}: {
  action: ShieldAction;
  actor: string;
  caseId: string;
  detail: string;
  queueItemId?: string;
  agentLabel?: string;
  practiceId?: string;
}): FhirAuditEventResource {
  const recorded = new Date().toISOString();
  const fhirAction = action === "accept" ? "U" : action === "reject" ? "D" : action === "edit" ? "U" : "E";

  return {
    resourceType: "AuditEvent",
    id: `shield-fhir-${Math.random().toString(36).slice(2, 12)}`,
    type: {
      system: "http://terminology.hl7.org/CodeSystem/audit-event-type",
      code: "110100",
      display: "Application Activity"
    },
    subtype: [
      {
        system: "https://akshhealth.app/fhir/CodeSystem/shield-action",
        code: action,
        display: `SHIELD ${action}`
      }
    ],
    action: fhirAction,
    recorded,
    outcome: action === "reject" ? "8" : "0",
    outcomeDesc: detail,
    agent: [
      {
        type: {
          system: "http://terminology.hl7.org/CodeSystem/extra-security-role-type",
          code: "humanuser",
          display: "Human user"
        },
        who: { display: actor },
        requestor: true
      },
      {
        type: {
          system: "https://akshhealth.app/fhir/CodeSystem/agent-role",
          code: "shield",
          display: "SHIELD compliance agent"
        },
        who: { display: "Aksh Health SHIELD" },
        requestor: false
      }
    ],
    source: { observer: { display: "Aksh Health SHIELD" } },
    entity: [
      {
        what: { reference: `ReviewCase/${caseId}`, display: `Review case ${caseId}` },
        role: {
          system: "http://terminology.hl7.org/CodeSystem/object-role",
          code: "1",
          display: "Patient"
        },
        detail: [
          ...(agentLabel ? [{ type: "agent", valueString: agentLabel }] : []),
          ...(queueItemId ? [{ type: "queueItemId", valueString: queueItemId }] : []),
          ...(practiceId ? [{ type: "practiceId", valueString: practiceId }] : []),
          { type: "syntheticOnly", valueString: "true" }
        ]
      }
    ]
  };
}

export function appendFhirShieldAudit(reviewCase: ReviewCase, event: FhirAuditEventResource): ReviewCase {
  return {
    ...reviewCase,
    fhirAuditEvents: [...(reviewCase.fhirAuditEvents ?? []), event]
  };
}

export function applyQueueItemStatus(
  items: ReviewQueueItem[],
  itemId: string,
  status: ReviewQueueItemStatus,
  options: { decidedBy: string; rejectionReason?: string; content?: string }
): ReviewQueueItem[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;

    return {
      ...item,
      status,
      content: options.content ?? item.content,
      decidedAt: formatCaseTimestamp(),
      decidedBy: options.decidedBy,
      rejectionReason: status === "REJECTED" ? options.rejectionReason?.trim() || "Rejected by reviewer" : undefined
    };
  });
}

export function appendShieldAudit(reviewCase: ReviewCase, event: AuditEvent): ReviewCase {
  return {
    ...reviewCase,
    auditEvents: [...reviewCase.auditEvents, event]
  };
}

export function appendCaseLevelShieldAudit(
  reviewCase: ReviewCase,
  options: {
    action: ShieldAction;
    actor: string;
    detail: string;
  }
): ReviewCase {
  const shieldEvent = createShieldAuditEvent({
    action: options.action,
    actor: options.actor,
    detail: options.detail
  });
  const fhirEvent = createFhirShieldAuditEvent({
    action: options.action,
    actor: options.actor,
    caseId: reviewCase.id,
    detail: options.detail,
    practiceId: reviewCase.practiceId
  });

  return appendFhirShieldAudit(appendShieldAudit(reviewCase, shieldEvent), fhirEvent);
}
