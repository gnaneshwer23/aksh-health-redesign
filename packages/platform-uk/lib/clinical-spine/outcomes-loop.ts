/**
 * Phase E — outcomes / learning closed loop on the clinical spine.
 * Care actions (HITL decisions) → eventual outcomes → governed evaluation.
 * Honesty: autoRetrain:false · ehrWrite:false · liveEmis:false · physiologicalTwin:false.
 */

import type { LearningEvent, LearningOutcomeKind } from "@/lib/clinical-proof/learning-loop";
import {
  linkLearningOutcome,
  listLearningEvents,
  recordLearningEvent
} from "@/lib/repositories/learning-event-repository";
import {
  recordGovernedEvaluation,
  listGovernedEvaluations,
  type GovernedEvaluationRecord,
  type GovernedGateId,
  type GovernedProposedAction
} from "@/lib/repositories/governed-evaluation-repository";
import { persistShieldAuditEvent } from "@/lib/repositories/shield-audit-repository";

export const SPINE_OUTCOMES_HONESTY = {
  ehrWrite: false as const,
  liveEmis: false as const,
  physiologicalTwin: false as const,
  autoRetrain: false as const,
  hitlRequired: true as const,
  modelUpdated: false as const
};

export type OutcomeReporterRole = "clinician" | "patient" | "admin";

export type SpineCareAction = {
  learningEventId: string;
  patientId: string | null;
  caseId: string | null;
  queueItemId: string | null;
  agentLabel: string;
  predictionId: string;
  predictionSummary?: string;
  decision: LearningEvent["decision"];
  decisionActor: string;
  outcomeKind: LearningOutcomeKind;
  outcomeSummary?: string;
  recordedAt: string;
  hasEventualOutcome: boolean;
  eventualOutcomeEventIds: string[];
  /**
   * `awaiting_outcome` — no disposition/outcome yet, never auto-closes (FR-LEARN-014).
   * `outcome_linked` — a genuinely observed/reported eventual outcome is linked (real outcome).
   * `immediate_outcome` — a real outcome was recorded at decision time itself (e.g. clinician/patient
   *   reported `adverse_event_none`/`adverse_event_suspected`/`care_action_completed` immediately) — real outcome.
   * `no_action_required` — Reject-driven closure (`outcomeKind:"care_action_deferred"`): there is
   *   nothing to follow up on a rejected draft, but this is a disposition, NOT a captured real-world
   *   outcome, and must never be presented as indistinguishable from one (B2 / Volume I FR-LEARN-012).
   */
  loopStage: "awaiting_outcome" | "outcome_linked" | "immediate_outcome" | "no_action_required";
};

export type OutcomesLoopStatus = {
  generatedAt: string;
  patientId: string | null;
  careActionCount: number;
  awaitingOutcomeCount: number;
  outcomeLinkedCount: number;
  /** Reject-driven closures with nothing to follow up — a disposition, not a real outcome. */
  noActionRequiredCount: number;
  evaluationReviewCount: number;
  openActions: SpineCareAction[];
  recentLinkedOutcomes: SpineCareAction[];
  /**
   * Every care action with an Accept/Edit/Reject disposition recorded (loopStage !== "awaiting_outcome"),
   * including Reject's "no_action_required" closure. This is a workload/throughput signal — it is
   * NOT a measure of how often a real-world outcome was actually captured (see `realOutcomeCaptureRatio`).
   */
  dispositionCompleteRatio: number;
  /**
   * Only counts care actions where a human (clinician/patient/admin) reported what actually happened
   * to the patient — `outcome_linked` or a genuinely-reported `immediate_outcome`. Excludes
   * `no_action_required` (Reject) and `awaiting_outcome`. This will typically start low and stay low —
   * outcome-reporting is best-effort/self-serve today (Volume I FR-LEARN-015) — and must never be
   * presented as "complete" or "high."
   */
  realOutcomeCaptureRatio: number;
  stages: Array<"care_action" | "eventual_outcome" | "governed_evaluation">;
  note: string;
} & typeof SPINE_OUTCOMES_HONESTY;

export type CaptureSpineOutcomeInput = {
  sourceEventId: string;
  outcomeKind: LearningOutcomeKind;
  outcomeSummary?: string;
  outcomeMetric?: { name: string; value: number | string; unit?: string } | null;
  decisionNotes?: string;
  reporterRole: OutcomeReporterRole;
  /** Optional health-plan / care-plan id for audit linkage */
  healthPlanId?: string | null;
};

export type CaptureSpineOutcomeResult = {
  linked: true;
  sourceEventId: string;
  outcomeEventId: string;
  reporterRole: OutcomeReporterRole;
  message: string;
  /** OQ-HITL-2: honest flag — the outcome above was linked regardless; this only reports the SHIELD audit mirror. */
  shieldAuditWriteFailed: boolean;
} & typeof SPINE_OUTCOMES_HONESTY;

export type GovernedGateCheck = {
  gateId: GovernedGateId;
  signed: boolean;
  signer?: string;
  note?: string;
};

export type SubmitGovernedEvaluationInput = {
  learningEventIdsReviewed: string[];
  gates: GovernedGateCheck[];
  proposedAction: GovernedProposedAction;
  rationale: string;
  actor: string;
};

export type SubmitGovernedEvaluationResult = {
  accepted: boolean;
  blockedReason?: string;
  evaluation?: GovernedEvaluationRecord;
  message: string;
  /** OQ-HITL-2: honest flag — the evaluation above was recorded regardless; this only reports the SHIELD audit mirror. */
  shieldAuditWriteFailed: boolean;
} & typeof SPINE_OUTCOMES_HONESTY;

const REQUIRED_GATES: GovernedGateId[] = ["G-ML-1", "G-ML-2", "G-ML-3"];

export function allGovernedGatesSigned(gates: GovernedGateCheck[]): boolean {
  return REQUIRED_GATES.every((id) => gates.some((g) => g.gateId === id && g.signed));
}

/** Block any model-update proposal unless G-ML-1…3 are explicitly signed. Never auto-retrains. */
export function assertGovernedEvaluationAllowed(
  input: Pick<SubmitGovernedEvaluationInput, "proposedAction" | "gates" | "rationale">
): { ok: true } | { ok: false; reason: string } {
  if (!input.rationale?.trim()) {
    return { ok: false, reason: "rationale is required for governed evaluation." };
  }
  if (input.proposedAction === "propose_model_update" && !allGovernedGatesSigned(input.gates)) {
    return {
      ok: false,
      reason:
        "propose_model_update blocked: G-ML-1, G-ML-2, and G-ML-3 must be signed. autoRetrain remains false."
    };
  }
  return { ok: true };
}

function classifyCareAction(
  event: LearningEvent,
  linkedBySource: Map<string, LearningEvent[]>
): SpineCareAction {
  const eventual = linkedBySource.get(event.id) ?? [];
  const hasEventualOutcome = eventual.length > 0;
  let loopStage: SpineCareAction["loopStage"] = "awaiting_outcome";
  if (hasEventualOutcome) {
    loopStage = "outcome_linked";
  } else if (event.outcomeKind === "care_action_deferred") {
    // Reject: nothing to follow up on a rejected draft — a disposition, not a real-world outcome.
    loopStage = "no_action_required";
  } else if (event.outcomeKind !== "unknown" && event.outcomeKind !== "follow_up_scheduled") {
    loopStage = "immediate_outcome";
  }

  return {
    learningEventId: event.id,
    patientId: event.patientId ?? null,
    caseId: event.caseId ?? null,
    queueItemId: event.queueItemId ?? null,
    agentLabel: event.agentLabel,
    predictionId: event.predictionId,
    predictionSummary: event.predictionSummary,
    decision: event.decision,
    decisionActor: event.decisionActor,
    outcomeKind: event.outcomeKind,
    outcomeSummary: event.outcomeSummary,
    recordedAt: event.recordedAt,
    hasEventualOutcome,
    eventualOutcomeEventIds: eventual.map((e) => e.id),
    loopStage
  };
}

/** Source care actions are learning rows that are not themselves outcome-link rows. */
export function buildCareActionsFromEvents(events: LearningEvent[]): SpineCareAction[] {
  const linkedBySource = new Map<string, LearningEvent[]>();
  for (const event of events) {
    if (!event.linksToEventId) continue;
    const list = linkedBySource.get(event.linksToEventId) ?? [];
    list.push(event);
    linkedBySource.set(event.linksToEventId, list);
  }

  return events
    .filter((e) => !e.linksToEventId)
    .map((e) => classifyCareAction(e, linkedBySource))
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

export async function listSpineCareActions(options: {
  scopeKey: string;
  patientId?: string;
  limit?: number;
}): Promise<{ source: "postgres" | "file"; actions: SpineCareAction[] }> {
  const listed = await listLearningEvents({
    scopeKey: options.scopeKey,
    limit: Math.min(Math.max(options.limit ?? 100, 1), 200)
  });
  let actions = buildCareActionsFromEvents(listed.events);
  if (options.patientId) {
    actions = actions.filter((a) => a.patientId === options.patientId);
  }
  return { source: listed.source, actions };
}

export async function buildOutcomesLoopStatus(options: {
  scopeKey: string;
  patientId?: string;
}): Promise<OutcomesLoopStatus> {
  const { actions } = await listSpineCareActions({
    scopeKey: options.scopeKey,
    patientId: options.patientId,
    limit: 100
  });
  const evaluations = await listGovernedEvaluations({
    scopeKey: options.scopeKey,
    limit: 50
  });

  const awaiting = actions.filter((a) => a.loopStage === "awaiting_outcome");
  const linked = actions.filter((a) => a.loopStage === "outcome_linked");
  const immediate = actions.filter((a) => a.loopStage === "immediate_outcome");
  const noActionRequired = actions.filter((a) => a.loopStage === "no_action_required");

  // Workload signal: any disposition recorded at all (Accept/Edit/Reject), including Reject's
  // no-action-required closure. This is what the pre-B2 single blended ratio actually measured.
  const dispositioned = actions.length - awaiting.length;
  const dispositionCompleteRatio = actions.length === 0 ? 0 : dispositioned / actions.length;

  // Honesty signal: only a genuinely observed/reported real-world outcome — excludes Reject's
  // no-action-required closure, which is a disposition, not an outcome.
  const realOutcomeCount = linked.length + immediate.length;
  const realOutcomeCaptureRatio = actions.length === 0 ? 0 : realOutcomeCount / actions.length;

  return {
    generatedAt: new Date().toISOString(),
    patientId: options.patientId ?? null,
    careActionCount: actions.length,
    awaitingOutcomeCount: awaiting.length,
    outcomeLinkedCount: linked.length,
    noActionRequiredCount: noActionRequired.length,
    evaluationReviewCount: evaluations.records.length,
    openActions: awaiting.slice(0, 20),
    recentLinkedOutcomes: linked.slice(0, 10),
    dispositionCompleteRatio: Math.round(dispositionCompleteRatio * 1000) / 1000,
    realOutcomeCaptureRatio: Math.round(realOutcomeCaptureRatio * 1000) / 1000,
    stages: ["care_action", "eventual_outcome", "governed_evaluation"],
    note:
      "Closed loop on shared learning store: HITL care actions → append-only eventual outcomes → governed evaluation. " +
      "dispositionCompleteRatio = any Accept/Edit/Reject disposition recorded (workload signal, includes Reject's " +
      "no-action-required closure). realOutcomeCaptureRatio = a human actually reported what happened (honesty " +
      "signal, excludes Reject) — best-effort/self-serve today, expected to stay low. autoRetrain:false always.",
    ...SPINE_OUTCOMES_HONESTY
  };
}

/**
 * Capture an eventual outcome against a prior spine care-action learning event.
 * Append-only; never mutates source; never auto-retrains.
 */
export async function captureSpineOutcome(
  input: CaptureSpineOutcomeInput,
  options: { scopeKey: string; actor: string }
): Promise<CaptureSpineOutcomeResult> {
  const reporterNote =
    input.reporterRole === "patient"
      ? "Patient-reported outcome on clinical spine"
      : input.reporterRole === "admin"
        ? "Admin-linked eventual outcome on clinical spine"
        : "Clinician-captured outcome on clinical spine";

  const { event, sourceEvent } = await linkLearningOutcome(
    input.sourceEventId,
    {
      outcomeKind: input.outcomeKind,
      outcomeSummary: input.outcomeSummary,
      outcomeMetric: input.outcomeMetric ?? null,
      decisionActor: options.actor,
      decisionNotes:
        input.decisionNotes ??
        `${reporterNote}${input.healthPlanId ? ` · healthPlan=${input.healthPlanId}` : ""}`
    },
    { scopeKey: options.scopeKey, shieldDualWrite: false }
  );

  const shieldResult = await persistShieldAuditEvent({
    action: "accept",
    actor: options.actor,
    label: `SHIELD: spine outcome captured (${input.reporterRole})`,
    detail: [
      `source=${sourceEvent.id}`,
      `outcome=${event.id}`,
      `kind=${input.outcomeKind}`,
      input.outcomeSummary ?? null,
      "autoRetrain=false"
    ]
      .filter(Boolean)
      .join(" · "),
    category: "continuous_learning",
    caseId: sourceEvent.caseId ?? undefined,
    queueItemId: sourceEvent.queueItemId ?? undefined,
    practiceId: sourceEvent.practiceId ?? undefined,
    agentLabel: sourceEvent.agentLabel,
    resourceRef: sourceEvent.predictionId,
    payload: {
      sourceEventId: sourceEvent.id,
      outcomeEventId: event.id,
      reporterRole: input.reporterRole,
      healthPlanId: input.healthPlanId ?? null,
      ...SPINE_OUTCOMES_HONESTY
    }
  });

  if (!shieldResult.persisted) {
    console.error(
      "[shield-audit] durable write failed for spine outcome capture",
      event.id,
      shieldResult.reason
    );
  }

  return {
    linked: true,
    sourceEventId: sourceEvent.id,
    outcomeEventId: event.id,
    reporterRole: input.reporterRole,
    message: `Eventual outcome linked (append-only). autoRetrain:false · modelUpdated:false · reporter=${input.reporterRole}.`,
    shieldAuditWriteFailed: !shieldResult.persisted,
    ...SPINE_OUTCOMES_HONESTY
  };
}

/**
 * Governed evaluation: review linked outcomes → learning signals → human gates.
 * Never auto-retrains. propose_model_update only records approval for *manual* release SOP.
 */
export async function submitGovernedEvaluation(
  input: SubmitGovernedEvaluationInput,
  options: { scopeKey: string }
): Promise<SubmitGovernedEvaluationResult> {
  const gateCheck = assertGovernedEvaluationAllowed(input);
  if (!gateCheck.ok) {
    return {
      accepted: false,
      blockedReason: gateCheck.reason,
      message: gateCheck.reason,
      shieldAuditWriteFailed: false,
      ...SPINE_OUTCOMES_HONESTY
    };
  }

  const evaluation = await recordGovernedEvaluation(
    {
      learningEventIdsReviewed: input.learningEventIdsReviewed,
      gates: input.gates,
      proposedAction: input.proposedAction,
      rationale: input.rationale.trim(),
      actor: input.actor,
      gatesAllSigned: allGovernedGatesSigned(input.gates),
      autoRetrainTriggered: false,
      modelUpdated: false,
      ehrWrite: false,
      status:
        input.proposedAction === "propose_model_update"
          ? "approved_for_manual_release"
          : input.proposedAction === "schedule_human_review"
            ? "pending_human_review"
            : "no_change_recorded"
    },
    { scopeKey: options.scopeKey }
  );

  // Dual-write a learning signal row for timeline / admin visibility — never a retrain.
  await recordLearningEvent(
    {
      agentLabel: "GOVERNED_EVAL",
      predictionId: `eval-${evaluation.id}`,
      predictionSummary: `Governed evaluation: ${input.proposedAction}`,
      decision: "accept",
      decisionActor: input.actor,
      decisionNotes: input.rationale.trim(),
      outcomeKind: "care_action_completed",
      outcomeSummary: `Evaluation ${evaluation.status} · gates G-ML-1…3 signed=${String(evaluation.gatesAllSigned)} · autoRetrain:false`
    },
    { scopeKey: options.scopeKey, shieldDualWrite: false }
  );

  const shieldResult = await persistShieldAuditEvent({
    action: "accept",
    actor: input.actor,
    label: "SHIELD: governed evaluation recorded (no auto-retrain)",
    detail: `${input.proposedAction} · ${evaluation.status} · reviewed=${input.learningEventIdsReviewed.length}`,
    category: "continuous_learning",
    agentLabel: "GOVERNED_EVAL",
    resourceRef: evaluation.id,
    payload: {
      evaluationId: evaluation.id,
      proposedAction: input.proposedAction,
      ...SPINE_OUTCOMES_HONESTY
    }
  });

  if (!shieldResult.persisted) {
    console.error(
      "[shield-audit] durable write failed for governed evaluation",
      evaluation.id,
      shieldResult.reason
    );
  }

  return {
    accepted: true,
    evaluation,
    message:
      input.proposedAction === "propose_model_update"
        ? "Manual release approved in recorder only — still requires ops to bump version per GOVERNED_MODEL_RELEASE_SOP. autoRetrain:false · modelUpdated:false."
        : `Governed evaluation recorded (${evaluation.status}). autoRetrain:false.`,
    shieldAuditWriteFailed: !shieldResult.persisted,
    ...SPINE_OUTCOMES_HONESTY
  };
}
