/**
 * Learning + Patient State versioning assertions (Stage 10).
 * Golden scenarios: AKSH-E2E-0008, 0018, 0020 (+ learning-loop honesty).
 */

import type { LearningEvent } from "../clinical-proof/learning-loop";
import type { OutcomesLoopStatus, SpineCareAction } from "../clinical-spine/outcomes-loop";
import { buildPatientStateSnapshot } from "../patient-state/projection";
import type { PatientStateFact } from "../patient-state/types";
import {
  MIN_POPULATION_CELL_SIZE,
  suppressSmallCell,
} from "../precision-health/population-suppression";
import { assertLearningEventHonesty } from "./hitl-intervention-assertions";
import type { GoldenScenario } from "./golden-scenarios";
import type { IdempotentRecordResult } from "./state-versioning";
import type { E2EGeneratedDataset, E2EPatientProfile } from "./types";

export type LearningStateAssertionResult = {
  scenarioId: string;
  ok: boolean;
  errors: string[];
};

export type E2EPopulationAggregate = {
  artifactType: "aksh-e2e-population-aggregate";
  batchId: string;
  seed: number;
  totalPatients: number;
  cohortCounts: Record<string, number>;
  deterioratingCount: number;
  improvingCount: number;
  highRiskCount: number;
  missingInfoCount: number;
  deterioratingDisplay: string;
  deterioratingSuppressed: boolean;
  minCellSize: number;
  isSynthetic: true;
  liveEmis: false;
  autoRetrain: false;
  note: string;
};

export function detectHba1cImprovement(patient: E2EPatientProfile): {
  improved: boolean;
  first: number | null;
  last: number | null;
  delta: number | null;
} {
  const series = patient.hba1cSeries;
  if (series.length < 2) {
    return { improved: false, first: null, last: null, delta: null };
  }
  const first = series[0]!.value;
  const last = series[series.length - 1]!.value;
  return {
    improved: last < first - 1,
    first,
    last,
    delta: last - first,
  };
}

export function buildE2EPopulationAggregate(dataset: E2EGeneratedDataset): E2EPopulationAggregate {
  const cohortCounts: Record<string, number> = {};
  let deterioratingCount = 0;
  let improvingCount = 0;
  let highRiskCount = 0;
  let missingInfoCount = 0;

  for (const p of dataset.patients) {
    cohortCounts[p.cohortId] = (cohortCounts[p.cohortId] ?? 0) + 1;
    if (p.cohortId === "B") deterioratingCount += 1;
    if (p.cohortId === "H") improvingCount += 1;
    if (p.riskLevel === "high" || p.riskLevel === "very_high") highRiskCount += 1;
    if (p.cohortId === "F" || p.missingDataFlags.length > 0) missingInfoCount += 1;
  }

  const cell = suppressSmallCell(deterioratingCount, MIN_POPULATION_CELL_SIZE);

  return {
    artifactType: "aksh-e2e-population-aggregate",
    batchId: dataset.manifest.batchId,
    seed: dataset.manifest.seed,
    totalPatients: dataset.patients.length,
    cohortCounts,
    deterioratingCount,
    improvingCount,
    highRiskCount,
    missingInfoCount,
    deterioratingDisplay: cell.display,
    deterioratingSuppressed: cell.suppressed,
    minCellSize: MIN_POPULATION_CELL_SIZE,
    isSynthetic: true,
    liveEmis: false,
    autoRetrain: false,
    note: "Synthetic E2E cohort aggregates — must match generator/manifest counts; small cells suppressed.",
  };
}

export function assertGoldenScenario0008(input: {
  generatorPatient: E2EPatientProfile;
  facts?: PatientStateFact[];
}): LearningStateAssertionResult {
  const errors: string[] = [];

  if (input.generatorPatient.cohortId !== "H") {
    errors.push(`generator patient must be cohort H (got ${input.generatorPatient.cohortId})`);
  }

  const traj = detectHba1cImprovement(input.generatorPatient);
  if (!traj.improved) {
    errors.push(
      `cohort H must show clinically meaningful HbA1c improvement (first=${traj.first}, last=${traj.last})`
    );
  }

  const weight = input.generatorPatient.weightSeries;
  if (weight.length >= 2) {
    const wFirst = weight[0]!.value;
    const wLast = weight[weight.length - 1]!.value;
    if (!(wLast < wFirst)) {
      // soft: generator may not always lose weight; only flag if series rises sharply
      if (wLast > wFirst + 2) {
        errors.push("improving cohort should not show large weight gain");
      }
    }
  }

  if (input.facts && input.facts.length > 0) {
    const snap = buildPatientStateSnapshot(input.generatorPatient.id, input.facts);
    const hba1c = snap.current.hba1c?.value as { value?: number } | undefined;
    if (hba1c?.value != null && traj.last != null && Math.abs(hba1c.value - traj.last) > 0.05) {
      errors.push(`projected hba1c ${hba1c.value} !== latest series ${traj.last}`);
    }
  }

  return { scenarioId: "AKSH-E2E-0008", ok: errors.length === 0, errors };
}

export function assertGoldenScenario0018(input: {
  first: IdempotentRecordResult;
  second: IdempotentRecordResult;
  allFacts: PatientStateFact[];
  patientId: string;
}): LearningStateAssertionResult {
  const errors: string[] = [];

  if (!input.second.deduplicated) {
    errors.push("second identical source-reference ingest must be deduplicated (no new fact row)");
  }
  if (input.second.fact.id !== input.first.fact.id) {
    errors.push("idempotent ingest must return the same logical fact id");
  }

  const sameType = input.allFacts.filter((f) => f.factType === input.first.fact.factType);
  const current = sameType.filter((f) => f.supersededBy === null);
  if (current.length !== 1) {
    errors.push(`expected exactly one current ${input.first.fact.factType} fact, got ${current.length}`);
  }

  // Re-ingest must not inflate history when deduped
  const matchingRef = sameType.filter(
    (f) => f.source.reference === input.first.fact.source.reference
  );
  if (matchingRef.length !== 1) {
    errors.push(
      `same source reference must yield one fact row (got ${matchingRef.length}) — no duplicate escalation`
    );
  }

  const snap = buildPatientStateSnapshot(input.patientId, input.allFacts);
  if (!snap.current[input.first.fact.factType]) {
    errors.push("snapshot must still expose the current fact after idempotent re-ingest");
  }

  return { scenarioId: "AKSH-E2E-0018", ok: errors.length === 0, errors };
}

export function assertStateVersioningSupersession(input: {
  patientId: string;
  facts: PatientStateFact[];
  factType: string;
  expectedCurrentValue: unknown;
}): string[] {
  const errors: string[] = [];
  const typed = input.facts.filter((f) => f.factType === input.factType);
  const current = typed.filter((f) => f.supersededBy === null);
  const superseded = typed.filter((f) => f.supersededBy !== null);

  if (typed.length < 2) {
    errors.push("versioning proof requires ≥2 facts of the same type (current + prior)");
  }
  if (current.length !== 1) {
    errors.push(`expected one current ${input.factType}, got ${current.length}`);
  }
  if (superseded.length < 1) {
    errors.push("prior fact must remain readable with supersededBy set");
  }
  if (current[0] && JSON.stringify(current[0].value) !== JSON.stringify(input.expectedCurrentValue)) {
    errors.push("current fact value mismatch after supersession");
  }
  for (const prior of superseded) {
    if (!prior.supersededBy) errors.push(`superseded fact ${prior.id} missing pointer`);
    // value must not be rewritten
    if (prior.value === undefined) errors.push(`superseded fact ${prior.id} lost its value`);
  }

  const snap = buildPatientStateSnapshot(input.patientId, input.facts);
  if (snap.factCount !== input.facts.filter((f) => f.patientId === input.patientId).length) {
    errors.push("snapshot factCount must include superseded history");
  }

  return errors;
}

export function assertGoldenScenario0020(input: {
  dataset: E2EGeneratedDataset;
  aggregate: E2EPopulationAggregate;
}): LearningStateAssertionResult {
  const errors: string[] = [];
  const { dataset, aggregate } = input;

  if (aggregate.totalPatients !== dataset.patients.length) {
    errors.push(
      `aggregate totalPatients ${aggregate.totalPatients} !== dataset ${dataset.patients.length}`
    );
  }
  if (aggregate.totalPatients !== dataset.manifest.patientCount) {
    errors.push(
      `aggregate totalPatients ${aggregate.totalPatients} !== manifest ${dataset.manifest.patientCount}`
    );
  }

  for (const [cohortId, count] of Object.entries(dataset.manifest.scenarioDistribution)) {
    if ((aggregate.cohortCounts[cohortId] ?? 0) !== count) {
      errors.push(
        `cohort ${cohortId} aggregate ${aggregate.cohortCounts[cohortId] ?? 0} !== manifest ${count}`
      );
    }
  }

  const expectedDeteriorating = dataset.patients.filter((p) => p.cohortId === "B").length;
  if (aggregate.deterioratingCount !== expectedDeteriorating) {
    errors.push(
      `deteriorating count ${aggregate.deterioratingCount} !== expected ${expectedDeteriorating}`
    );
  }

  const cell = suppressSmallCell(expectedDeteriorating, MIN_POPULATION_CELL_SIZE);
  if (aggregate.deterioratingSuppressed !== cell.suppressed) {
    errors.push("deteriorating suppression flag must match suppressSmallCell");
  }
  if (aggregate.deterioratingDisplay !== cell.display) {
    errors.push(`deteriorating display "${aggregate.deterioratingDisplay}" !== "${cell.display}"`);
  }
  if (cell.suppressed && aggregate.deterioratingDisplay === String(expectedDeteriorating)) {
    errors.push("suppressed cell must never expose the exact count as display");
  }

  if (aggregate.liveEmis !== false || aggregate.autoRetrain !== false) {
    errors.push("population aggregate must keep liveEmis/autoRetrain false");
  }
  if (!aggregate.isSynthetic) {
    errors.push("E2E population aggregate must be labelled synthetic");
  }

  return { scenarioId: "AKSH-E2E-0020", ok: errors.length === 0, errors };
}

export function assertLearningLoopClosed(input: {
  acceptEvent: LearningEvent;
  outcomeEvent: LearningEvent;
  careAction?: SpineCareAction | null;
  loop?: OutcomesLoopStatus | null;
}): string[] {
  const errors = [
    ...assertLearningEventHonesty(input.acceptEvent),
    ...assertLearningEventHonesty(input.outcomeEvent),
  ];

  if (input.acceptEvent.decision !== "accept") {
    errors.push("learning loop start must be an Accept decision");
  }
  if (input.outcomeEvent.linksToEventId !== input.acceptEvent.id) {
    errors.push("outcome must append-link to Accept event (never UPDATE source row)");
  }
  if (input.careAction && input.careAction.loopStage !== "outcome_linked") {
    errors.push(`closed loop expects outcome_linked (got ${input.careAction.loopStage})`);
  }
  if (input.loop && input.loop.outcomeLinkedCount < 1) {
    errors.push("outcomes loop must count ≥1 outcome_linked care action");
  }

  return errors;
}

export function assertGoldenLearningScenario(
  scenario: GoldenScenario,
  context: Record<string, unknown>
): LearningStateAssertionResult {
  switch (scenario.testId) {
    case "AKSH-E2E-0008":
      return assertGoldenScenario0008(
        context as Parameters<typeof assertGoldenScenario0008>[0]
      );
    case "AKSH-E2E-0018":
      return assertGoldenScenario0018(
        context as Parameters<typeof assertGoldenScenario0018>[0]
      );
    case "AKSH-E2E-0020":
      return assertGoldenScenario0020(
        context as Parameters<typeof assertGoldenScenario0020>[0]
      );
    default:
      return {
        scenarioId: scenario.testId,
        ok: false,
        errors: [`unsupported learning/state golden scenario ${scenario.testId}`],
      };
  }
}
