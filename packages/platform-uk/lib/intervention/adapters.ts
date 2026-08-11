/**
 * Intervention domain — per-source adapters (D3, docs/PHASED_BUILD_PLAN_D.md,
 * implements docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P2-2).
 *
 * Each function below is a pure, read-only mapping from an existing,
 * unmodified draft-producing type to the shared `InterventionDraftSummary`
 * (./types.ts). None of these mutate their input or change any existing
 * construction/call site — they are additive views only.
 */

import type { HealthPlanDraft } from "../precision-health/health-plan";
import type { CoachingDraft } from "../precision-health/coaching";
import type { DiabetesCoachingDraft } from "../disease-modules/diabetes/types";
import type { ReviewCase, ReviewQueueItem, ReviewQueueItemStatus } from "../types";
import type { InterventionDraftStatus, InterventionDraftSummary } from "./types";

export function healthPlanDraftToInterventionSummary(draft: HealthPlanDraft): InterventionDraftSummary {
  return {
    id: draft.id,
    domain: "health_plan",
    patientId: draft.patientId,
    patientLabel: draft.patientLabel,
    title: "Personalised health plan",
    // HealthPlanDraft's own status union is currently the single literal "DRAFT" —
    // mapped here rather than widened, so this adapter needs no change if/when
    // health-plan.ts itself grows accepted/rejected states.
    status: draft.status === "DRAFT" ? "draft" : "draft",
    hitlRequired: draft.hitlRequired,
    ehrWrite: draft.ehrWrite
  };
}

export function coachingDraftToInterventionSummary(draft: CoachingDraft): InterventionDraftSummary {
  return {
    id: `coaching-${draft.agentId}-${draft.patientId}`,
    domain: "coaching",
    patientId: draft.patientId,
    patientLabel: draft.patientLabel,
    title: draft.title,
    // CoachingDraft itself carries no accept/reject state (that lives on the
    // consuming ReviewQueueItem, if/when one wraps it) — every draft this
    // adapter sees is, by definition, still a draft.
    status: "draft",
    hitlRequired: draft.hitlRequired,
    ehrWrite: draft.ehrWrite
  };
}

export function diabetesCoachingDraftToInterventionSummary(draft: DiabetesCoachingDraft): InterventionDraftSummary {
  return {
    id: `diabetes-coaching-${draft.agentId}-${draft.patientId}`,
    domain: "diabetes_coaching",
    patientId: draft.patientId,
    patientLabel: draft.patientLabel,
    title: draft.title,
    status: "draft",
    hitlRequired: draft.hitlRequired,
    ehrWrite: draft.ehrWrite
  };
}

const REVIEW_QUEUE_STATUS_TO_INTERVENTION_STATUS: Record<ReviewQueueItemStatus, InterventionDraftStatus> = {
  DRAFT: "draft",
  ACCEPTED: "accepted",
  REJECTED: "rejected"
};

/**
 * PATHWAY's referral package is represented as a `ReviewQueueItem`
 * (itemType: "referral_package") plus the parent `ReviewCase` it belongs to
 * (lib/referral-agent.ts) — not a standalone `patientId`-carrying type.
 * `hitlRequired`/`ehrWrite` are restated as the platform-wide invariant they
 * already are everywhere in this codebase (every referral requires a GP
 * Accept before any `ServiceRequest` write-back stub is even attached —
 * lib/referral-agent.ts's own `applyReferralAccept`; no live write path
 * exists anywhere per lib/emis-staging.ts/lib/clinical-proof/ehr-writeback-sim.ts),
 * not read off a field on `ReviewQueueItem`/`ServiceRequestResource` that
 * doesn't exist.
 */
export function referralQueueItemToInterventionSummary(
  reviewCase: Pick<ReviewCase, "id" | "patientId" | "patientLabel">,
  item: ReviewQueueItem
): InterventionDraftSummary {
  return {
    id: item.id,
    domain: "referral",
    patientId: reviewCase.patientId ?? reviewCase.id,
    patientLabel: reviewCase.patientLabel,
    title: item.title,
    status: REVIEW_QUEUE_STATUS_TO_INTERVENTION_STATUS[item.status],
    hitlRequired: true,
    ehrWrite: false
  };
}
