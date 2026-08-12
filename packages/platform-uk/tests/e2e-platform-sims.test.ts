import assert from "node:assert/strict";

import {
  resolveCareTeam,
  routeCriticalLabToClinician,
  routePharmacyTaskToCareTeam,
} from "../lib/e2e/care-team-sim";
import { generateE2EDataset } from "../lib/e2e/generator";
import { GOLDEN_SCENARIOS } from "../lib/e2e/golden-scenarios";
import {
  completeLabResult,
  findDelayedLabs,
  markLabDelayed,
} from "../lib/e2e/lab-sim";
import {
  createCoordinationTaskFromPharmacyEvent,
  documentPharmacyBarrier,
  escalateCoordinationTaskToClinician,
  findAdherenceFailures,
} from "../lib/e2e/pharmacy-sim";
import {
  assertCareTeamRoutingIntegrity,
  assertGoldenStakeholderScenario,
} from "../lib/e2e/stakeholder-sim-assertions";
import { findCriticalLabEvents } from "../lib/e2e/decision-safety-assertions";

const SCENARIO_0013 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0013")!;
const SCENARIO_0014 = GOLDEN_SCENARIOS.find((s) => s.testId === "AKSH-E2E-0014")!;

async function run() {
  const dataset = generateE2EDataset({ seed: 20260812 });
  const cohortF = dataset.patients.find((p) => p.cohortId === "F");
  const cohortE = dataset.patients.find((p) => p.cohortId === "E");
  const cohortC = dataset.patients.find((p) => p.cohortId === "C");
  assert.ok(cohortF && cohortE && cohortC);

  // --- AKSH-E2E-0013: lab delay → no fabrication → complete updates state ---
  const delayed = findDelayedLabs(dataset.labEvents, {
    patientId: cohortF.id,
    testName: "eGFR",
  });
  assert.ok(delayed.length >= 1, "cohort F must have delayed eGFR");

  const before = assertGoldenStakeholderScenario(SCENARIO_0013, {
    generatorPatient: cohortF,
    labEvents: dataset.labEvents,
  });
  assert.equal(before.ok, true, before.errors.join("; "));

  const completed = completeLabResult({
    event: delayed[0]!,
    value: 58,
    unit: "mL/min/1.73m²",
    actor: "e2e.lab",
  });
  assert.equal(completed.event.status, "completed");
  assert.equal(completed.event.value, 58);
  assert.ok(completed.patientStateFact);
  assert.equal(completed.patientStateFact!.factType, "egfr");
  assert.equal(completed.liveNhsLab, false);

  const after = assertGoldenStakeholderScenario(SCENARIO_0013, {
    generatorPatient: cohortF,
    labEvents: dataset.labEvents,
    completed,
  });
  assert.equal(after.ok, true, after.errors.join("; "));

  // Idempotent duplicate complete
  const dup = completeLabResult({
    event: completed.event,
    value: 58,
    actor: "e2e.lab",
  });
  assert.equal(dup.event.status, "duplicate");

  // markLabDelayed round-trip from ordered-like completed is not allowed without going through delayed path —
  // prove delayed marker clears value
  const syntheticOrdered = {
    ...delayed[0]!,
    status: "ordered" as const,
    resultFlag: "normal" as const,
    value: 60,
    resultedAt: "2026-07-02T00:00:00.000Z",
  };
  const reDelayed = markLabDelayed({ event: syntheticOrdered, actor: "e2e.lab" });
  assert.equal(reDelayed.event.value, null);
  assert.equal(reDelayed.event.status, "delayed");

  // --- AKSH-E2E-0014: pharmacy adherence → care coordinator → clinician ---
  const failures = findAdherenceFailures(dataset.pharmacyEvents, { patientId: cohortE.id });
  assert.ok(failures.length >= 1);

  const careTeam = resolveCareTeam(cohortE, dataset.users);
  assert.ok(careTeam.members.length >= 1);
  assert.equal(careTeam.liveDirectory, false);

  let task = createCoordinationTaskFromPharmacyEvent({
    event: failures[0]!,
    actor: "e2e.pharmacy",
  });
  task = documentPharmacyBarrier(
    task,
    "Patient reports access barrier — synthetic adherence failure",
    "e2e.carecoordinator"
  );
  task = escalateCoordinationTaskToClinician(task, "e2e.carecoordinator");
  assert.equal(task.assigneeRole, "gp");
  assert.equal(task.status, "escalated_to_clinician");

  const followUp = routePharmacyTaskToCareTeam({ task, careTeam });
  assert.equal(followUp.assignedRole, "gp");
  assert.equal(followUp.source, "pharmacy");

  const result0014 = assertGoldenStakeholderScenario(SCENARIO_0014, {
    generatorPatient: cohortE,
    pharmacyEvents: dataset.pharmacyEvents,
    task,
    followUp,
    careTeam,
  });
  assert.equal(result0014.ok, true, result0014.errors.join("; "));

  // Care-team routing for critical lab (ties to 0009 stakeholder handoff)
  const critical = findCriticalLabEvents(dataset.labEvents, cohortC.id);
  assert.ok(critical.length >= 1);
  const careTeamC = resolveCareTeam(cohortC, dataset.users);
  const labFollowUp = routeCriticalLabToClinician({
    patientId: cohortC.id,
    labEventId: critical[0]!.id,
    careTeam: careTeamC,
    summary: "Critical HbA1c — clinician review required (simulated)",
  });
  assert.equal(labFollowUp.assignedRole, "gp");
  assert.deepEqual(
    assertCareTeamRoutingIntegrity({ careTeam: careTeamC, followUps: [followUp, labFollowUp] }),
    []
  );

  console.log(
    `E2E stakeholder sims passed (${SCENARIO_0013.testId} delayed→complete; ${SCENARIO_0014.testId} pharmacy→care-team; critical lab route ok).`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
