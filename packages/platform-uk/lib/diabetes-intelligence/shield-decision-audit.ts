/**
 * P1-SHIELD-01 — fail-visible SHIELD dual-write for diabetes domain Accept/Edit/Reject.
 * Mirrors spine `persistShieldAuditEvent` discipline: never undoes the clinical decide;
 * surfaces `{ shieldAuditWriteFailed, shieldAuditWriteReason }` to callers.
 */
import {
  persistShieldAuditEvent,
  type DurableShieldAuditInput,
} from "@/lib/repositories/shield-audit-repository";

export type DiabetesDomainShieldSource =
  | "agent_intel"
  | "medcare_safety"
  | "medcare_plan"
  | "journey_plan"
  | "glucose_review"
  | "continuous_care";

export type DiabetesDomainShieldResult = {
  shieldAuditWriteFailed: boolean;
  shieldAuditWriteReason: string | null;
  shieldAuditPersisted: boolean;
};

export async function persistDiabetesDomainShieldDecision(input: {
  source: DiabetesDomainShieldSource;
  action: "accept" | "edit" | "reject" | string;
  actor: string;
  patientId: string;
  subjectId: string;
  reason?: string | null;
  careEpisodeId?: string | null;
  practiceId?: string | null;
}): Promise<DiabetesDomainShieldResult> {
  const payload: DurableShieldAuditInput["payload"] = {
    source: input.source,
    patientId: input.patientId,
    subjectId: input.subjectId,
    careEpisodeId: input.careEpisodeId ?? null,
    ehrWrite: false,
    autonomousClinicalAction: false,
  };

  const result = await persistShieldAuditEvent({
    action: input.action,
    actor: input.actor,
    agentLabel: "SHIELD",
    category: "reviewer_decision",
    label: `SHIELD: ${input.source} ${input.action}`,
    detail: input.reason?.trim() || `${input.source} decision recorded (HITL; ehrWrite:false)`,
    caseId: null,
    queueItemId: input.subjectId,
    practiceId: input.practiceId ?? null,
    resourceRef: `${input.source}:${input.subjectId}`,
    payload,
  });

  if (result.persisted) {
    return {
      shieldAuditWriteFailed: false,
      shieldAuditWriteReason: null,
      shieldAuditPersisted: true,
    };
  }

  return {
    shieldAuditWriteFailed: true,
    shieldAuditWriteReason: result.reason ?? "shield_audit_write_failed",
    shieldAuditPersisted: false,
  };
}
