/**
 * C5 (docs/PHASED_BUILD_PLAN_C.md, minimum bar — implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P1-1): Diabetes MVP loop slice —
 * the CONNECT→…→LEARN proof path's LEARN step for diabetes coaching drafts.
 *
 * When a diabetes coaching draft (`buildDiabetesRiskContribution`'s
 * `coachingDrafts`) is Accepted via the existing HITL Accept flow, this
 * records a learning event with a diabetes-labelled `agentLabel` — reusing
 * `recordLearningEvent` (lib/repositories/learning-event-repository.ts)
 * exactly as-is, the same call this module's siblings (queue-decision.ts,
 * outcomes-loop.ts) already use for every other agent's Accept. No new
 * learning-event schema, no new loop-stage value, no new audit path.
 */

import { recordLearningEvent } from "../../repositories/learning-event-repository";
import type { DiabetesCoachingDraft } from "./types";

export type RecordDiabetesCoachingAcceptInput = {
  draft: DiabetesCoachingDraft;
  decisionActor: string;
  caseId?: string | null;
  practiceId?: string | null;
};

/**
 * Records one HITL Accept of a diabetes coaching draft. `agentLabel` is the
 * draft's own diabetes-specific coaching agent id (`NUTRITION_DIABETES` /
 * `EXERCISE_DIABETES` / `BEHAVIOUR_DIABETES`) — never a generic label — so
 * this is distinguishable from every other agent's learning events in
 * SHIELD audit / analytics, per the module's own naming convention
 * (lib/disease-modules/diabetes/types.ts's DiabetesCoachingAgentId).
 *
 * `outcomeKind: "follow_up_scheduled"` mirrors queue-decision.ts's own
 * Accept mapping — the resulting care action starts in the same
 * `awaiting_outcome` loopStage as every other accepted draft (no new
 * loopStage introduced by this phase).
 */
export async function recordDiabetesCoachingAccept(
  input: RecordDiabetesCoachingAcceptInput,
  options: { scopeKey: string }
) {
  const { draft } = input;
  const decisionActor = input.decisionActor?.trim();
  if (!decisionActor) {
    throw new Error("decisionActor is required to accept a diabetes coaching draft (HITL)");
  }

  return recordLearningEvent(
    {
      patientId: draft.patientId,
      caseId: input.caseId ?? null,
      practiceId: input.practiceId ?? null,
      agentLabel: draft.agentId,
      predictionId: `diabetes-coaching-${draft.moduleId.toLowerCase()}-${draft.patientId}-${Date.now()}`,
      predictionSummary: draft.summary,
      decision: "accept",
      decisionActor,
      decisionNotes: "Accepted diabetes coaching draft (HITL) — wellness talking points, not clinical advice.",
      outcomeKind: "follow_up_scheduled"
    },
    { scopeKey: options.scopeKey, shieldDualWrite: true }
  );
}
