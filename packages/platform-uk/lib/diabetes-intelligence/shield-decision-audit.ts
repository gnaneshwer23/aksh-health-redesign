/**
 * P0-SHIELD-INTEGRITY — consequential diabetes-domain Accept/Edit/Reject must not
 * finalise without a durable SHIELD audit when Postgres is configured.
 *
 * Contract:
 * - Postgres configured → fail-closed: SHIELD must persist *before* domain finalisation.
 *   If audit cannot persist, finalisation is blocked (503 / SHIELD_AUDIT_REQUIRED).
 * - Postgres unavailable (local file store) → same honesty as review-case `auditDurable:false`:
 *   decide may proceed; callers still receive `shieldAuditWriteFailed`.
 *
 * Order is audit-then-finalise so a crashed decide cannot leave APPROVED/REJECTED
 * without a corresponding audit intent. Orphan audits (audit ok, decide later fails)
 * are acceptable; silent unaudited finalisation is not.
 */
import {
  persistShieldAuditEvent,
  type DurableShieldAuditInput,
} from "@/lib/repositories/shield-audit-repository";

/** Mirrors `isPostgresConfigured` without importing the Pool client (keeps this gate lightweight). */
function durableAuditRequired(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.USE_POSTGRES === "true");
}

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

export type DiabetesDomainShieldInput = {
  source: DiabetesDomainShieldSource;
  action: "accept" | "edit" | "reject" | string;
  actor: string;
  patientId: string;
  subjectId: string;
  reason?: string | null;
  careEpisodeId?: string | null;
  practiceId?: string | null;
};

export class ShieldAuditIntegrityError extends Error {
  readonly code = "SHIELD_AUDIT_REQUIRED";
  readonly status = 503;
  readonly shieldAuditWriteReason: string;

  constructor(reason: string) {
    super(
      `Decision not finalised: SHIELD audit could not be persisted (${reason}). Retry when audit storage is available.`
    );
    this.name = "ShieldAuditIntegrityError";
    this.shieldAuditWriteReason = reason;
  }
}

export async function persistDiabetesDomainShieldDecision(
  input: DiabetesDomainShieldInput
): Promise<DiabetesDomainShieldResult> {
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

/**
 * Gate used by withRequiredDiabetesDomainShield. Exported for unit proofs so
 * fail-closed behaviour can be asserted without opening a DB connection.
 */
export function assertDurableShieldOrThrow(shield: DiabetesDomainShieldResult): void {
  if (!shield.shieldAuditPersisted && durableAuditRequired()) {
    throw new ShieldAuditIntegrityError(
      shield.shieldAuditWriteReason ?? "shield_audit_write_failed"
    );
  }
}

/**
 * Persist SHIELD first; block domain finalisation when durable audit is required
 * (Postgres) and the write failed. Then run `finalize`.
 */
export async function withRequiredDiabetesDomainShield<T extends object>(
  input: DiabetesDomainShieldInput,
  finalize: () => Promise<T>
): Promise<
  T & {
    shieldAuditWriteFailed: boolean;
    shieldAuditWriteReason: string | null;
  }
> {
  const shield = await persistDiabetesDomainShieldDecision(input);
  assertDurableShieldOrThrow(shield);

  const result = await finalize();
  return {
    ...result,
    shieldAuditWriteFailed: shield.shieldAuditWriteFailed,
    shieldAuditWriteReason: shield.shieldAuditWriteReason,
  };
}
