import type { CareEpisodeStatus } from "./types";
import { CARE_EPISODE_STATUSES } from "./types";

const ALLOWED: Record<CareEpisodeStatus, readonly CareEpisodeStatus[]> = {
  draft: ["intake", "scheduled", "cancelled"],
  intake: ["scheduled", "encounter_active", "cancelled"],
  scheduled: ["encounter_active", "cancelled"],
  encounter_active: ["context_assembled", "in_review", "cancelled"],
  context_assembled: ["in_review", "cancelled"],
  in_review: ["lab_pending", "med_review", "care_plan_draft", "follow_up", "outcome_recorded", "cancelled"],
  lab_pending: ["med_review", "in_review", "care_plan_draft", "cancelled"],
  med_review: ["care_plan_draft", "in_review", "follow_up", "cancelled"],
  care_plan_draft: ["follow_up", "outcome_recorded", "in_review", "cancelled"],
  follow_up: ["outcome_recorded", "encounter_active", "closed", "cancelled"],
  outcome_recorded: ["closed", "follow_up"],
  closed: [],
  cancelled: [],
};

export type TransitionValidation =
  | { ok: true }
  | { ok: false; code: "UNKNOWN_STATUS" | "TERMINAL" | "NOT_ALLOWED"; message: string };

export function isCareEpisodeStatus(value: string): value is CareEpisodeStatus {
  return (CARE_EPISODE_STATUSES as readonly string[]).includes(value);
}

export function allowedTransitionsFrom(from: CareEpisodeStatus): readonly CareEpisodeStatus[] {
  return ALLOWED[from] ?? [];
}

export function validateCareEpisodeTransition(
  from: CareEpisodeStatus,
  to: CareEpisodeStatus
): TransitionValidation {
  if (!isCareEpisodeStatus(from) || !isCareEpisodeStatus(to)) {
    return { ok: false, code: "UNKNOWN_STATUS", message: `Unknown status: ${from} → ${to}` };
  }
  if (from === "closed" || from === "cancelled") {
    return {
      ok: false,
      code: "TERMINAL",
      message: `Episode is ${from}; no further transitions allowed.`,
    };
  }
  if (from === to) {
    return { ok: false, code: "NOT_ALLOWED", message: `Already in status ${from}.` };
  }
  const next = ALLOWED[from];
  if (!next.includes(to)) {
    return {
      ok: false,
      code: "NOT_ALLOWED",
      message: `Transition ${from} → ${to} is not allowed. Allowed: ${next.join(", ") || "(none)"}.`,
    };
  }
  return { ok: true };
}

export const CANONICAL_CARE_EPISODE_PATH: readonly CareEpisodeStatus[] = [
  "draft",
  "intake",
  "scheduled",
  "encounter_active",
  "context_assembled",
  "in_review",
  "lab_pending",
  "med_review",
  "care_plan_draft",
  "follow_up",
  "outcome_recorded",
  "closed",
] as const;

export function assertCanonicalPathValid(): void {
  for (let i = 0; i < CANONICAL_CARE_EPISODE_PATH.length - 1; i++) {
    const from = CANONICAL_CARE_EPISODE_PATH[i]!;
    const to = CANONICAL_CARE_EPISODE_PATH[i + 1]!;
    const result = validateCareEpisodeTransition(from, to);
    if (!result.ok) {
      throw new Error(`Canonical path broken at ${from} → ${to}: ${result.message}`);
    }
  }
}
