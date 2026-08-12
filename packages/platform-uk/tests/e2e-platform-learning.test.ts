import assert from "node:assert/strict";

import { buildOutcomesLoopStatus, captureSpineOutcome, listSpineCareActions } from "../lib/clinical-spine/outcomes-loop";
import { recordSpineQueueDecisions } from "../lib/clinical-spine/queue-decision";
import { generateE2EDataset } from "../lib/e2e/generator";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import {
  assertGoldenLearningScenario,
  assertLearningLoopClosed,
  assertStateVersioningSupersession,
  buildE2EPopulationAggregate,
  detectHba1cImprovement,
} from "../lib/e2e/learning-state-assertions";
import { projectE2EFactsForPatient } from "../lib/e2e/patient-state-assertions";
import {
  describeStateVersionDelta,
  recordPatientStateFactIdempotent,
} from "../lib/e2e/state-versioning";
import { listPatientStateFacts, recordPatientStateFact } from "../lib/patient-state/repository";
import { findLearningEventById } from "../lib/repositories/learning-event-repository";
import { reviewCases as seedCases } from "../lib/mock-data";
import { updateQueueItemDecision } from "../lib/workflow/review-queue";
import type { ReviewCase } from "../lib/types";
import { E2E_SOURCE } from "../lib/e2e/types";

const SCENARIO_0008 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0008")!;
const SCENARIO_0018 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0018")!;
const SCENARIO_0020 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0020")!;

function minimalPatelCase(): ReviewCase {
  const seeded =
    seedCases.find((c) => c.id === "case-patel-demo") ??
    seedCases.find((c) => c.scenarioId === "PATEL-DEMO") ??
    seedCases[0];
  if (!seeded) throw new Error("No seed review cases");
  const soap =
    seeded.reviewQueueItems?.find((i) => i.itemType === "soap_note") ??
    seeded.reviewQueueItems?.[0];
  return {
    ...seeded,
    id: "case-patel-demo",
    scenarioId: "PATEL-DEMO",
    patientLabel: "Mr James Patel — T2D (P002)",
    reviewQueueItems: soap
      ? [
          {
            ...soap,
            id: "q-soap-learn",
            status: "DRAFT",
            decidedBy: undefined,
            decidedAt: undefined,
            content: soap.content ?? soap.summary,
          },
        ]
      : [
          {
            id: "q-soap-learn",
            agentId: "SYNTHESIS",
            itemType: "soap_note",
            status: "DRAFT",
            title: "SOAP draft",
            summary: "Learning loop rehearsal",
          },
        ],
  };
}

async function run() {
  const dataset = generateE2EDataset({ seed: 20260812 });
  const cohortH = dataset.patients.find((p) => p.cohortId === "H");
  const cohortB = dataset.patients.find((p) => p.cohortId === "B");
  assert.ok(cohortH && cohortB);

  // --- AKSH-E2E-0008: detect positive improvement ---
  const traj = detectHba1cImprovement(cohortH);
  assert.equal(traj.improved, true);
  const projected = projectE2EFactsForPatient(cohortH.id, dataset.patientStateFacts);
  const result0008 = assertGoldenLearningScenario(SCENARIO_0008, {
    generatorPatient: cohortH,
    facts: Object.values(projected.current),
  });
  // projected.current values are facts - better pass full seed-projected list
  const hFacts = dataset.patientStateFacts
    .filter((f) => f.patientId === cohortH.id)
    .map((seed) => ({
      id: seed.id,
      patientId: seed.patientId,
      factType: seed.factType,
      value: seed.value,
      source: { system: seed.sourceSystem, reference: seed.sourceReference },
      confidence: seed.confidence,
      consentScopeId: null,
      effectiveAt: seed.effectiveAt,
      recordedAt: seed.recordedAt,
      supersededBy: null as string | null,
    }));
  const result0008b = assertGoldenLearningScenario(SCENARIO_0008, {
    generatorPatient: cohortH,
    facts: hFacts,
  });
  assert.equal(result0008b.ok, true, result0008b.errors.join("; "));
  void result0008;

  // --- AKSH-E2E-0018: duplicate ingest idempotency + supersession versioning ---
  const scopeKey = `e2e_state_ver_${Date.now()}`;
  const patientId = "P002";
  const sourceRef = `${dataset.manifest.batchId}:${patientId}:lab:dup-hba1c-0018`;

  const first = await recordPatientStateFactIdempotent(
    {
      patientId,
      factType: "hba1c",
      value: { value: 8.4, unit: "%", isSynthetic: true },
      source: { system: E2E_SOURCE, reference: sourceRef },
      confidence: 1,
      effectiveAt: "2026-08-01T09:00:00.000Z",
    },
    { scopeKey }
  );
  assert.equal(first.deduplicated, false);

  const second = await recordPatientStateFactIdempotent(
    {
      patientId,
      factType: "hba1c",
      value: { value: 8.4, unit: "%", isSynthetic: true },
      source: { system: E2E_SOURCE, reference: sourceRef },
      confidence: 1,
      effectiveAt: "2026-08-01T09:00:00.000Z",
    },
    { scopeKey }
  );
  assert.equal(second.deduplicated, true);

  const { facts: afterDup } = await listPatientStateFacts(patientId, { scopeKey });
  const result0018 = assertGoldenLearningScenario(SCENARIO_0018, {
    first,
    second,
    allFacts: afterDup,
    patientId,
  });
  assert.equal(result0018.ok, true, result0018.errors.join("; "));

  // Different source reference → genuine versioning (supersede, history preserved)
  const beforeVersion = afterDup;
  const newer = await recordPatientStateFact(
    {
      patientId,
      factType: "hba1c",
      value: { value: 7.9, unit: "%", isSynthetic: true },
      source: { system: E2E_SOURCE, reference: `${sourceRef}:v2` },
      confidence: 1,
      effectiveAt: "2026-08-10T09:00:00.000Z",
    },
    { scopeKey }
  );
  const { facts: afterVersion } = await listPatientStateFacts(patientId, { scopeKey });
  const delta = describeStateVersionDelta(patientId, beforeVersion, afterVersion);
  assert.equal(delta.historyPreserved, true);
  assert.ok(delta.afterFactCount > delta.beforeFactCount);

  const versionErrors = assertStateVersioningSupersession({
    patientId,
    facts: afterVersion,
    factType: "hba1c",
    expectedCurrentValue: newer.fact.value,
  });
  assert.deepEqual(versionErrors, []);

  // --- AKSH-E2E-0020: population aggregate honesty ---
  const aggregate = buildE2EPopulationAggregate(dataset);
  const result0020 = assertGoldenLearningScenario(SCENARIO_0020, { dataset, aggregate });
  assert.equal(result0020.ok, true, result0020.errors.join("; "));
  assert.equal(aggregate.deterioratingCount, dataset.manifest.scenarioDistribution.B);
  assert.equal(aggregate.improvingCount, dataset.manifest.scenarioDistribution.H);

  // Determinism: second build identical (ignore nothing — pure)
  assert.deepEqual(buildE2EPopulationAggregate(dataset), aggregate);

  // --- Learning loop closed (Accept → linked outcome) ---
  const learnScope = `e2e_learn_loop_${Date.now()}`;
  const existing = minimalPatelCase();
  const accepted = updateQueueItemDecision(existing, "q-soap-learn", "ACCEPTED", {
    decidedBy: "Dr E2E Learn",
  });
  const spine = await recordSpineQueueDecisions({
    existing,
    next: accepted,
    scopeKey: learnScope,
    actor: "Dr E2E Learn",
  });
  const acceptLookup = await findLearningEventById(spine.learningEventIds[0]!, {
    scopeKey: learnScope,
  });
  assert.ok(acceptLookup.event);

  const captured = await captureSpineOutcome(
    {
      sourceEventId: acceptLookup.event!.id,
      outcomeKind: "care_action_completed",
      outcomeSummary: "Follow-up HbA1c improved (synthetic Stage 10).",
      outcomeMetric: { name: "hba1c", value: 7.0, unit: "%" },
      reporterRole: "clinician",
    },
    { scopeKey: learnScope, actor: "Dr E2E Learn" }
  );
  const outcomeLookup = await findLearningEventById(captured.outcomeEventId, {
    scopeKey: learnScope,
  });
  assert.ok(outcomeLookup.event);

  const loop = await buildOutcomesLoopStatus({ scopeKey: learnScope, patientId: "P002" });
  const { actions } = await listSpineCareActions({ scopeKey: learnScope, patientId: "P002" });
  const careAction = actions.find((a) => a.learningEventId === acceptLookup.event!.id);
  assert.deepEqual(
    assertLearningLoopClosed({
      acceptEvent: acceptLookup.event!,
      outcomeEvent: outcomeLookup.event!,
      careAction,
      loop,
    }),
    []
  );

  console.log(
    `E2E learning/state passed (${SCENARIO_0008.testId} improve Δ=${traj.delta}; ${SCENARIO_0018.testId} dedup; ${SCENARIO_0020.testId} n=${aggregate.totalPatients} deteriorating=${aggregate.deterioratingDisplay}; learning loop closed).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
