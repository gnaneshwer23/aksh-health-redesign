/**
 * Milestone A2 — SHIELD consistency for CONDUCTOR / clinical-spine beyond #92 diabetes decide.
 *
 * Contract (mirrors diabetes-domain audit-before-finalisation):
 * - Postgres configured → durable SHIELD must succeed before drafts may enter HITL queue.
 * - Local file store (no Postgres) → enqueue may proceed; callers still see shield flags.
 */

/** Mirrors isPostgresConfigured without importing the Pool client. */
export function durableShieldRequiredForEnqueue(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim() || process.env.USE_POSTGRES === "true");
}

export type ShieldEnqueueGateInput = {
  guardianAllowsEnqueue: boolean;
  shieldPersisted: boolean;
  durableRequired?: boolean;
};

export type ShieldEnqueueGateResult = {
  draftEnqueueAllowed: boolean;
  shieldBlockedEnqueue: boolean;
  reason: "ok" | "guardian_block" | "shield_unavailable" | "guardian_and_shield";
};

export function resolveShieldAwareEnqueue(input: ShieldEnqueueGateInput): ShieldEnqueueGateResult {
  const durableRequired = input.durableRequired ?? durableShieldRequiredForEnqueue();
  const guardianOk = input.guardianAllowsEnqueue;
  const shieldOk = input.shieldPersisted || !durableRequired;

  if (guardianOk && shieldOk) {
    return { draftEnqueueAllowed: true, shieldBlockedEnqueue: false, reason: "ok" };
  }
  if (!guardianOk && !shieldOk) {
    return {
      draftEnqueueAllowed: false,
      shieldBlockedEnqueue: true,
      reason: "guardian_and_shield",
    };
  }
  if (!guardianOk) {
    return { draftEnqueueAllowed: false, shieldBlockedEnqueue: false, reason: "guardian_block" };
  }
  return { draftEnqueueAllowed: false, shieldBlockedEnqueue: true, reason: "shield_unavailable" };
}

export class ShieldUnavailableForEnqueueError extends Error {
  readonly code = "SHIELD_UNAVAILABLE";
  readonly status = 503;

  constructor(detail?: string) {
    super(
      detail ??
        "Draft enqueue blocked: durable SHIELD audit was required but not persisted. Retry when audit storage is available."
    );
    this.name = "ShieldUnavailableForEnqueueError";
  }
}
