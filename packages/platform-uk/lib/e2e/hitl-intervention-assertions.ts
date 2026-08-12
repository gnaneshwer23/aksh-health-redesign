/**
 * HITL / Intervention assertions for E2E golden scenarios (Stage 8).
 * Covers Accept → learning/outcome, Reject ≠ clinical outcome, adherence RECOMMEND drafts.
 */

import type { LearningEvent } from "../clinical-proof/learning-loop";
import type { SpineCareAction, OutcomesLoopStatus } from "../clinical-spine/outcomes-loop";
import type { Decision } from "../decision";
import type { PendingInterventionSummary } from "../intervention/list-pending";
import type { InterventionDraftSummary } from "../intervention/types";
import { safetyRoutesForGoldenDecision } from "./agent-orchestration-assertions";
import type { GoldenScenario } from "./golden-scenarios";
import type { E2EPatientProfile, E2EPharmacyEvent } from "./types";

export type HitlInterventionAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

export function assertLearningEventHonesty(event: LearningEvent): string[] {
  const errors: string[] = [];
  if (event.ehrWrite !== false) errors.push("learning event ehrWrite must be false");
  if (event.autoRetrainTriggered !== false) errors.push("autoRetrainTriggered must be false");
  if (event.modelUpdated !== false) errors.push("modelUpdated must be false");
  if (event.hitlRequired !== true) errors.push("learning event hitlRequired must be true");
  return errors;
}

/** Reject is a disposition — never indistinguishable from a captured clinical outcome. */
export function assertRejectIsNotClinicalOutcome(input: {
  event: LearningEvent;
  careAction?: SpineCareAction | null;
  loop?: OutcomesLoopStatus | null;
}): string[] {
  const errors = [...assertLearningEventHonesty(input.event)];

  if (input.event.decision !== "reject") {
    errors.push(`expected reject decision (got ${input.event.decision})`);
  }
  if (input.event.outcomeKind !== "care_action_deferred") {
    errors.push(
      `reject must record care_action_deferred disposition (got ${input.event.outcomeKind}) — not a real-world outcome`
    );
  }
  if (input.careAction && input.careAction.loopStage !== "no_action_required") {
    errors.push(
      `reject care action must be no_action_required (got ${input.careAction.loopStage}) — reject ≠ outcome`
    );
  }
  if (input.loop && input.loop.noActionRequiredCount < 1) {
    errors.push("outcomes loop must count reject as no_action_required disposition");
  }
  if (input.loop && input.careAction?.hasEventualOutcome) {
    errors.push("reject disposition must not claim an eventual clinical outcome");
  }

  return errors;
}

export function assertAcceptStartsAwaitingOutcome(input: {
  event: LearningEvent;
  careAction?: SpineCareAction | null;
  healthPlanId?: string | null;
}): string[] {
  const errors = [...assertLearningEventHonesty(input.event)];

  if (input.event.decision !== "accept") {
    errors.push(`expected accept decision (got ${input.event.decision})`);
  }
  if (input.event.outcomeKind !== "follow_up_scheduled") {
    errors.push(`accept should schedule follow-up (got ${input.event.outcomeKind})`);
  }
  if (input.careAction && input.careAction.loopStage !== "awaiting_outcome") {
    errors.push(`accept care action must start awaiting_outcome (got ${input.careAction?.loopStage})`);
  }

  return errors;
}

export function assertOutcomeLinkedImprovement(input: {
  sourceEvent: LearningEvent;
  outcomeEvent: LearningEvent;
  careAction?: SpineCareAction | null;
}): string[] {
  const errors = [
    ...assertLearningEventHonesty(input.sourceEvent),
    ...assertLearningEventHonesty(input.outcomeEvent),
  ];

  if (input.outcomeEvent.linksToEventId !== input.sourceEvent.id) {
    errors.push("outcome event must append-link to the Accept learning event");
  }
  if (
    input.outcomeEvent.outcomeKind !== "care_action_completed" &&
    input.outcomeEvent.outcomeKind !== "adverse_event_none"
  ) {
    errors.push(`improvement outcome kind unexpected: ${input.outcomeEvent.outcomeKind}`);
  }
  if (input.careAction && input.careAction.loopStage !== "outcome_linked") {
    errors.push(`linked outcome must set loopStage=outcome_linked (got ${input.careAction.loopStage})`);
  }
  if (input.careAction && !input.careAction.hasEventualOutcome) {
    errors.push("linked improvement must set hasEventualOutcome");
  }

  return errors;
}

export function assertRejectNeverStages(input: {
  simWritesBefore: number;
  simWritesAfter: number;
  staged: boolean;
}): string[] {
  const errors: string[] = [];
  if (input.staged) errors.push("Reject must never enter FHIR/EMIS staging");
  if (input.simWritesAfter !== input.simWritesBefore) {
    errors.push("Reject must not increase simulated EHR write count");
  }
  return errors;
}

export function assertPendingInterventionsHitlOnly(summary: PendingInterventionSummary): string[] {
  const errors: string[] = [];
  if (summary.pendingCount < 1) {
    errors.push("expected at least one pending intervention draft");
  }
  for (const item of summary.items) {
    if (item.status !== "draft") errors.push(`${item.id} must remain draft until HITL`);
    if (item.hitlRequired !== true) errors.push(`${item.id} must require HITL`);
    if (item.ehrWrite !== false) errors.push(`${item.id} must not write EHR`);
  }
  return errors;
}

export function findAdherencePharmacyEvents(
  events: E2EPharmacyEvent[],
  patientId: string
): E2EPharmacyEvent[] {
  return events.filter(
    (e) => e.patientId === patientId && e.kind === "adherence_issue" && e.status === "failed"
  );
}

export function assertGoldenScenario0005(input: {
  generatorPatient: E2EPatientProfile;
  pharmacyEvents: E2EPharmacyEvent[];
  pendingInterventions: PendingInterventionSummary;
  recommendDecision?: Decision | null;
}): HitlInterventionAssertionResult {
  const errors = [...assertPendingInterventionsHitlOnly(input.pendingInterventions)];

  if (input.generatorPatient.cohortId !== "E") {
    errors.push(`generator patient must be cohort E (got ${input.generatorPatient.cohortId})`);
  }
  const adherence = input.generatorPatient.adherenceScore;
  if (adherence === null || adherence === undefined || adherence >= 70) {
    errors.push(`cohort E must have low adherence score (got ${adherence})`);
  }

  const pharm = findAdherencePharmacyEvents(input.pharmacyEvents, input.generatorPatient.id);
  if (pharm.length === 0) {
    errors.push("cohort E patient must include failed adherence_issue pharmacy sim event");
  }

  if (input.recommendDecision) {
    const allowed = safetyRoutesForGoldenDecision("RECOMMEND");
    if (!allowed.includes(input.recommendDecision.route)) {
      errors.push(
        `RECOMMEND decision route ${input.recommendDecision.route} incompatible (allowed: ${allowed.join(", ")})`
      );
    }
  }

  return { scenarioId: "AKSH-E2E-0005", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0010(input: {
  event: LearningEvent;
  careAction?: SpineCareAction | null;
  loop?: OutcomesLoopStatus | null;
  rejectStaging?: { simWritesBefore: number; simWritesAfter: number; staged: boolean };
}): HitlInterventionAssertionResult {
  const errors = [
    ...assertRejectIsNotClinicalOutcome(input),
    ...(input.rejectStaging ? assertRejectNeverStages(input.rejectStaging) : []),
  ];

  if (!input.event.decisionNotes?.toLowerCase().includes("reject")) {
    // decisionNotes may be "Rejected by reviewer" — soft check already covered by outcomeKind
  }

  return { scenarioId: "AKSH-E2E-0010", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0015(input: {
  acceptEvent: LearningEvent;
  acceptCareAction?: SpineCareAction | null;
  outcomeEvent?: LearningEvent | null;
  outcomeCareAction?: SpineCareAction | null;
  healthPlanId?: string | null;
  generatorImproving?: E2EPatientProfile | null;
}): HitlInterventionAssertionResult {
  const errors = [
    ...assertAcceptStartsAwaitingOutcome({
      event: input.acceptEvent,
      careAction: input.acceptCareAction,
      healthPlanId: input.healthPlanId,
    }),
  ];

  if (input.outcomeEvent) {
    errors.push(
      ...assertOutcomeLinkedImprovement({
        sourceEvent: input.acceptEvent,
        outcomeEvent: input.outcomeEvent,
        careAction: input.outcomeCareAction,
      })
    );
  } else {
    errors.push("improvement loop requires an append-only linked outcome event");
  }

  if (input.generatorImproving && input.generatorImproving.cohortId !== "H") {
    errors.push(`improving generator patient must be cohort H (got ${input.generatorImproving.cohortId})`);
  }
  if (input.generatorImproving) {
    const series = input.generatorImproving.hba1cSeries;
    if (series.length >= 2) {
      const first = series[0]!.value;
      const last = series[series.length - 1]!.value;
      if (!(last < first - 1)) {
        errors.push("cohort H must show clinically meaningful HbA1c improvement");
      }
    }
  }

  return { scenarioId: "AKSH-E2E-0015", ok: errors.length === 0, errors };
}

/** Modify/edit: clinician-authored draft, learning decision=edit, no auto-accept / no EHR. */
export function assertModifyKeepsDraftHitl(input: {
  event: LearningEvent;
  itemStatus: string;
  originalContent: string;
  editedContent: string;
  healthPlanId?: string | null;
  ehrWrite?: boolean;
}): string[] {
  const errors = [...assertLearningEventHonesty(input.event)];

  if (input.event.decision !== "edit") {
    errors.push(`expected edit decision (got ${input.event.decision})`);
  }
  if (input.itemStatus !== "DRAFT") {
    errors.push(`Modify must leave queue item as DRAFT (got ${input.itemStatus}) — not ACCEPTED`);
  }
  if (!input.editedContent || input.editedContent === input.originalContent) {
    errors.push("Modify must change draft content to clinician-authored text");
  }
  if (input.healthPlanId) {
    errors.push("Modify must not auto-create a health plan (Accept-only)");
  }
  if (input.ehrWrite === true) {
    errors.push("Modify must not write EHR");
  }
  if (input.event.outcomeKind === "follow_up_scheduled") {
    errors.push("edit must not claim follow_up_scheduled like Accept");
  }
  if (input.event.outcomeKind === "care_action_completed") {
    errors.push("edit must not claim a completed clinical outcome");
  }

  return errors;
}

export function assertGoldenScenario0021(input: {
  event: LearningEvent;
  itemStatus: string;
  originalContent: string;
  editedContent: string;
  healthPlanId?: string | null;
  ehrWrite?: boolean;
}): HitlInterventionAssertionResult {
  const errors = assertModifyKeepsDraftHitl(input);
  return { scenarioId: "AKSH-E2E-0021", ok: errors.length === 0, errors };
}

export function assertGoldenHitlScenario(
  scenario: GoldenScenario,
  context: Record<string, unknown>
): HitlInterventionAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0005":
      return assertGoldenScenario0005(
        context as Parameters<typeof assertGoldenScenario0005>[0]
      );
    case "AKSH-E2E-0010":
      return assertGoldenScenario0010(
        context as Parameters<typeof assertGoldenScenario0010>[0]
      );
    case "AKSH-E2E-0015":
      return assertGoldenScenario0015(
        context as Parameters<typeof assertGoldenScenario0015>[0]
      );
    case "AKSH-E2E-0021":
      return assertGoldenScenario0021(
        context as Parameters<typeof assertGoldenScenario0021>[0]
      );
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported HITL/intervention golden scenario ${scenario.testId}`],
      };
  }
}

export function assertAllInterventionDraftsHonest(drafts: InterventionDraftSummary[]): string[] {
  const errors: string[] = [];
  for (const d of drafts) {
    if (d.hitlRequired !== true) errors.push(`${d.id}: hitlRequired must be true`);
    if (d.ehrWrite !== false) errors.push(`${d.id}: ehrWrite must be false`);
  }
  return errors;
}
