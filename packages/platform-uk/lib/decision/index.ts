/**
 * Decision module (C2 — docs/PHASED_BUILD_PLAN_C.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P0-2; escalation extended in C6,
 * implements P1-3).
 *
 * Separates Domain 3 (Decision) from Domain 2 (Intelligence)/orchestration
 * at the module boundary — a pure extraction/re-export, zero behaviour
 * change to `route`. `resolveDecision` delegates to the existing
 * `resolveSafetyRouteFromOrchestration` (lib/clinical-spine/safety-route.ts)
 * for `route` — the underlying resolver, its inputs, and its output values
 * are untouched by this module; this only gives the Decision domain one
 * named, independently-callable entry point.
 */

import type { OrchestrationResult, QueuePriority } from "@/lib/clinical-proof/agent-orchestration";
import { resolveSafetyRouteFromOrchestration, type SafetyRoute } from "@/lib/clinical-spine/safety-route";
import type { DiabetesRiskContribution } from "@/lib/disease-modules/diabetes";

/**
 * C6 (docs/PHASED_BUILD_PLAN_C.md, P1-3): diabetes-specific escalation,
 * additive to the "none" placeholder C2 introduced. Non-diabetes patients
 * (or any caller that omits `diabetes`) always resolve to "none" — byte-
 * identical to pre-C6 behaviour.
 */
export type DecisionEscalation = "none" | "diabetes_nurse_review" | "routine_coaching";

export type Decision = {
  route: SafetyRoute;
  priority: QueuePriority | null;
  escalation: DecisionEscalation;
  explanation: string;
  contributingIntelligenceRefs: string[];
};

/**
 * C6/P1-3 escalation rule (deterministic, no LLM judgement):
 *  - No diabetes contribution (module off, patient not diabetes-flagged, or
 *    simply not supplied) → "none". This is the exact pre-C6 behaviour.
 *  - A GUARDIAN-facing diabetes safety flag (hypo event, GLP-1 side effect)
 *    OR a "referral_indicated" complication → "diabetes_nurse_review": the
 *    diabetes contribution itself already decided this warrants a human
 *    beyond routine coaching (mirrors the existing referral_pathway /
 *    GUARDIAN escalation intent, just made explicit on Decision).
 *  - Otherwise, if there is at least one coaching draft → "routine_coaching".
 *  - Otherwise → "none" (nothing to route).
 * This never changes `route`/`priority` — it is an additive, informational
 * field alongside them, not a new parallel decision path (P1-3 scope).
 */
function resolveDiabetesEscalation(diabetes: DiabetesRiskContribution | null | undefined): DecisionEscalation {
  if (!diabetes) return "none";

  const hasNurseReviewTrigger =
    diabetes.guardianSafetyFlags.length > 0 ||
    diabetes.signals.complications.some((c) => c.flagLevel === "referral_indicated");
  if (hasNurseReviewTrigger) return "diabetes_nurse_review";

  if (diabetes.coachingDrafts.length > 0) return "routine_coaching";

  return "none";
}

export function resolveDecision(input: {
  orchestration: OrchestrationResult | null;
  ingestedCount?: number;
  expectedModalities?: number;
  /** C6/P1-3 — omit (or pass null) for non-diabetes patients; escalation resolves to "none" either way. */
  diabetes?: DiabetesRiskContribution | null;
}): Decision {
  const route = resolveSafetyRouteFromOrchestration(input.orchestration, {
    ingestedCount: input.ingestedCount,
    expectedModalities: input.expectedModalities
  });

  return {
    route,
    priority: input.orchestration?.queuePriority ?? null,
    escalation: resolveDiabetesEscalation(input.diabetes),
    explanation: input.orchestration
      ? `resolveSafetyRouteFromOrchestration → ${route} (queuePriority=${input.orchestration.queuePriority})`
      : `resolveSafetyRouteFromOrchestration → ${route} (no orchestration result)`,
    contributingIntelligenceRefs: input.orchestration?.reviewOrder ?? []
  };
}
