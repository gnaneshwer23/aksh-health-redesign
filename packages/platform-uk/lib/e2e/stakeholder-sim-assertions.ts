/**
 * Stakeholder simulation assertions for E2E golden scenarios (Stage 9).
 * Lab delay (0013), pharmacy adherence failure (0014), care-team routing.
 */

import { resolveDecision } from "../decision";
import type { CareTeamFollowUp, CareTeamSnapshot } from "./care-team-sim";
import { GOLDEN_SCENARIOS, type GoldenScenario } from "./golden-scenarios";
import {
  assertNoInferredValueWhileDelayed,
  completeLabResult,
  findDelayedLabs,
  type LabSimResult,
} from "./lab-sim";
import type { PharmacyCoordinationTask } from "./pharmacy-sim";
import { findAdherenceFailures } from "./pharmacy-sim";
import type { E2ELabEvent, E2EPatientProfile, E2EPharmacyEvent } from "./types";

export type StakeholderSimAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

export function assertGoldenScenario0013(input: {
  generatorPatient: E2EPatientProfile;
  labEvents: E2ELabEvent[];
  completed?: LabSimResult | null;
}): StakeholderSimAssertionResult {
  const errors: string[] = [];

  if (input.generatorPatient.cohortId !== "F") {
    errors.push(`generator patient must be cohort F (got ${input.generatorPatient.cohortId})`);
  }

  const delayed = findDelayedLabs(input.labEvents, {
    patientId: input.generatorPatient.id,
    testName: "eGFR",
  });
  if (delayed.length === 0) {
    // Cohort F may shuffle tests — accept any delayed lab for this patient
    const anyDelayed = findDelayedLabs(input.labEvents, { patientId: input.generatorPatient.id });
    if (anyDelayed.length === 0) {
      errors.push("cohort F patient must include at least one delayed/missing lab event");
    } else {
      for (const lab of anyDelayed) {
        errors.push(...assertNoInferredValueWhileDelayed(lab));
      }
    }
  } else {
    for (const lab of delayed) {
      errors.push(...assertNoInferredValueWhileDelayed(lab));
    }
  }

  // While delayed: OBSERVE / acquire-data style — never invent renal fact from empty series
  if (input.generatorPatient.egfrSeries.length > 0) {
    errors.push("cohort F must not seed eGFR series while lab is delayed");
  }

  const acquireOrObserve = resolveDecision({
    orchestration: null,
    ingestedCount: 1,
    expectedModalities: 4,
  });
  if (acquireOrObserve.route !== "request_more_data") {
    errors.push(`delayed lab safe-wait expects request_more_data (got ${acquireOrObserve.route})`);
  }

  if (input.completed) {
    if (input.completed.fabricated !== false) {
      errors.push("completed lab must declare fabricated:false");
    }
    if (input.completed.liveNhsLab !== false || input.completed.ehrWrite !== false) {
      errors.push("lab completion must remain simulated (liveNhsLab/ehrWrite false)");
    }
    if (input.completed.event.status !== "completed" && input.completed.event.status !== "duplicate") {
      errors.push(`expected completed lab status (got ${input.completed.event.status})`);
    }
    if (input.completed.event.value === null) {
      errors.push("completed lab must carry an explicit measured value");
    }
    if (!input.completed.patientStateFact && input.completed.event.status === "completed") {
      errors.push("completed lab should emit a patient-state fact seed for state update");
    }
  }

  return { scenarioId: "AKSH-E2E-0013", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0014(input: {
  generatorPatient: E2EPatientProfile;
  pharmacyEvents: E2EPharmacyEvent[];
  task: PharmacyCoordinationTask;
  followUp: CareTeamFollowUp;
  careTeam: CareTeamSnapshot;
}): StakeholderSimAssertionResult {
  const errors: string[] = [];

  if (input.generatorPatient.cohortId !== "E") {
    errors.push(`generator patient must be cohort E (got ${input.generatorPatient.cohortId})`);
  }

  const failures = findAdherenceFailures(input.pharmacyEvents, {
    patientId: input.generatorPatient.id,
  });
  if (failures.length === 0) {
    errors.push("cohort E patient must include failed adherence_issue pharmacy event");
  }

  if (input.task.hitlRequired !== true || input.task.ehrWrite !== false) {
    errors.push("pharmacy coordination task must be HITL-only with ehrWrite:false");
  }
  if (input.task.livePrescribing !== false) {
    errors.push("pharmacy task must not claim live prescribing");
  }
  if (!input.task.barrierSummary) {
    errors.push("pharmacy barrier must be documented on the coordination task");
  }

  if (input.followUp.source !== "pharmacy") {
    errors.push("care-team follow-up must source from pharmacy");
  }
  if (input.followUp.ehrWrite !== false || input.followUp.hitlRequired !== true) {
    errors.push("care-team follow-up must remain HITL / no EHR write");
  }
  if (!input.followUp.assignedToUserId) {
    errors.push("care-team follow-up must assign a synthetic team member");
  }
  if (input.careTeam.liveDirectory !== false) {
    errors.push("care team must not claim live directory");
  }
  if (input.careTeam.members.length < 1) {
    errors.push("care team must resolve at least the primary doctor");
  }

  return { scenarioId: "AKSH-E2E-0014", ok: errors.length === 0, errors };
}

export function assertCareTeamRoutingIntegrity(input: {
  careTeam: CareTeamSnapshot;
  followUps: CareTeamFollowUp[];
}): string[] {
  const errors: string[] = [];
  if (input.careTeam.ehrWrite !== false) errors.push("care team ehrWrite must be false");
  for (const f of input.followUps) {
    if (f.ehrWrite !== false) errors.push(`${f.id}: ehrWrite must be false`);
    if (f.hitlRequired !== true) errors.push(`${f.id}: hitlRequired must be true`);
  }
  return errors;
}

export function runLabDelayResolutionDemo(input: {
  delayedEvent: E2ELabEvent;
  value: number;
  actor: string;
}): LabSimResult {
  return completeLabResult({
    event: input.delayedEvent,
    value: input.value,
    actor: input.actor,
  });
}

export function assertGoldenStakeholderScenario(
  scenario: GoldenScenario,
  context: Record<string, unknown>
): StakeholderSimAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0013":
      return assertGoldenScenario0013(
        context as Parameters<typeof assertGoldenScenario0013>[0]
      );
    case "AKSH-E2E-0014":
      return assertGoldenScenario0014(
        context as Parameters<typeof assertGoldenScenario0014>[0]
      );
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported stakeholder sim golden scenario ${scenario.testId}`],
      };
  }
}

export const STAGE9_GOLDEN_IDS = ["AKSH-E2E-0013", "AKSH-E2E-0014"] as const;

export function getStage9GoldenScenarios() {
  return GOLDEN_SCENARIOS.filter((s) =>
    (STAGE9_GOLDEN_IDS as readonly string[]).includes(s.testId)
  );
}
