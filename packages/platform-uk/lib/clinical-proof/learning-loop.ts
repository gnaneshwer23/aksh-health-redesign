/**
 * Continuous-learning safe loop — record only.
 *
 * Links: prediction (agent draft) → clinician decision (HITL) → outcome.
 * NEVER auto-retrains, NEVER silently updates models, NEVER writes to EHR.
 */

import { randomUUID } from "crypto";

export const LEARNING_LOOP_INVARIANTS = {
  hitlMandatory: "Every learning record requires a clinician decision (accept | edit | reject | defer)",
  noAutoRetrain: "Recording an outcome must never trigger model retrain or weight update",
  noSilentModelUpdate: "Model / prompt versions change only via explicit governed release",
  appendOnly: "Learning events are append-only; no UPDATE/DELETE of clinical learning rows",
  draftNotRecord: "Prediction drafts remain non-records; learning does not promote them to EHR"
} as const;

export type LearningDecision = "accept" | "edit" | "reject" | "defer";

export type LearningOutcomeKind =
  | "care_action_completed"
  | "care_action_deferred"
  | "adverse_event_none"
  | "adverse_event_suspected"
  | "follow_up_scheduled"
  | "unknown";

export type LearningEventInput = {
  patientId?: string | null;
  caseId?: string | null;
  queueItemId?: string | null;
  practiceId?: string | null;
  agentLabel: string;
  /** Stable id or hash of the prediction/draft being judged */
  predictionId: string;
  predictionSummary?: string;
  /** Optional model / prompt version string for audit — never auto-bumped by this recorder */
  modelVersion?: string | null;
  decision: LearningDecision;
  decisionActor: string;
  decisionNotes?: string;
  /** Defaults to unknown when deferred — link eventual outcome via append-only link */
  outcomeKind?: LearningOutcomeKind;
  outcomeSummary?: string;
  /** Measurable signal if available (e.g. HbA1c delta) — observational only */
  outcomeMetric?: { name: string; value: number | string; unit?: string } | null;
  /**
   * When set, this row is an append-only eventual-outcome link to a prior event.
   * Original rows are never UPDATEd.
   */
  linksToEventId?: string | null;
};

export type LearningEvent = LearningEventInput & {
  id: string;
  recordedAt: string;
  outcomeKind: LearningOutcomeKind;
  autoRetrainTriggered: false;
  modelUpdated: false;
  ehrWrite: false;
  hitlRequired: true;
  governanceNote: string;
};

export type LearningOutcomeLinkInput = {
  outcomeKind: LearningOutcomeKind;
  outcomeSummary?: string;
  outcomeMetric?: { name: string; value: number | string; unit?: string } | null;
  decisionActor: string;
  decisionNotes?: string;
};

export const LEARNING_GOVERNANCE_NOTE =
  "Stored for governed evaluation only. No auto-retrain. Model updates require CSO/release authority sign-off.";

export function assertLearningDecisionRequiresHitl(decision: string): asserts decision is LearningDecision {
  if (!["accept", "edit", "reject", "defer"].includes(decision)) {
    throw new Error(`Invalid learning decision "${decision}" — HITL decision required`);
  }
}

export function buildLearningEvent(
  input: LearningEventInput,
  idFactory: () => string = () => `learn-${randomUUID()}`
): LearningEvent {
  assertLearningDecisionRequiresHitl(input.decision);

  const agentLabel = input.agentLabel?.trim();
  const predictionId = input.predictionId?.trim();
  const decisionActor = input.decisionActor?.trim();

  if (!agentLabel) throw new Error("agentLabel is required");
  if (!predictionId) throw new Error("predictionId is required");
  if (!decisionActor) throw new Error("decisionActor is required");

  return {
    ...input,
    id: idFactory(),
    recordedAt: new Date().toISOString(),
    agentLabel,
    predictionId,
    decisionActor,
    patientId: input.patientId ?? null,
    caseId: input.caseId ?? null,
    queueItemId: input.queueItemId ?? null,
    practiceId: input.practiceId ?? null,
    modelVersion: input.modelVersion ?? null,
    outcomeKind: input.outcomeKind ?? "unknown",
    outcomeMetric: input.outcomeMetric ?? null,
    linksToEventId: input.linksToEventId ?? null,
    autoRetrainTriggered: false,
    modelUpdated: false,
    ehrWrite: false,
    hitlRequired: true,
    governanceNote: LEARNING_GOVERNANCE_NOTE
  };
}

/**
 * Build an append-only eventual-outcome link event from a prior learning event.
 * Never mutates the source; never triggers retrain.
 */
export function buildLinkedOutcomeEvent(
  source: LearningEvent,
  link: LearningOutcomeLinkInput,
  idFactory: () => string = () => `learn-${randomUUID()}`
): LearningEvent {
  if (source.linksToEventId) {
    throw new Error("Cannot link an outcome to an event that is already an outcome link");
  }

  return buildLearningEvent(
    {
      patientId: source.patientId,
      caseId: source.caseId,
      queueItemId: source.queueItemId,
      practiceId: source.practiceId,
      agentLabel: source.agentLabel,
      predictionId: source.predictionId,
      predictionSummary: source.predictionSummary,
      modelVersion: source.modelVersion,
      decision: source.decision,
      decisionActor: link.decisionActor,
      decisionNotes: link.decisionNotes ?? `Eventual outcome linked to ${source.id}`,
      outcomeKind: link.outcomeKind,
      outcomeSummary: link.outcomeSummary,
      outcomeMetric: link.outcomeMetric,
      linksToEventId: source.id
    },
    idFactory
  );
}

/** Contract check used by clinical-proof: recorder never claims retrain/update. */
export function assertNoAutoRetrain(event: LearningEvent) {
  if (event.autoRetrainTriggered !== false) {
    throw new Error("Learning event must never set autoRetrainTriggered=true");
  }
  if (event.modelUpdated !== false) {
    throw new Error("Learning event must never set modelUpdated=true");
  }
  if (event.ehrWrite !== false) {
    throw new Error("Learning event must never claim ehrWrite");
  }
  if (event.hitlRequired !== true) {
    throw new Error("Learning event must keep hitlRequired=true");
  }
  return true;
}
