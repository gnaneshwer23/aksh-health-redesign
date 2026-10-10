import assert from "node:assert/strict";

import {
  assertCohortReadyForProof,
  getClinicalProofCohortSummary,
  REQUIRED_CLINICAL_PROFILES
} from "../lib/clinical-proof/cohort";
import { patients } from "../lib/mock-data/patients";
import { getSimulatedPatientCohortSummary } from "../lib/simulated-patients";

function run() {
  const summary = getClinicalProofCohortSummary();
  assert.ok(summary.meetsSizeGate, `Need ≥25 patients, got ${summary.totalPatients}`);
  assert.equal(summary.missingProfiles.length, 0, `Missing profiles: ${summary.missingProfiles.join(", ")}`);
  assert.equal(REQUIRED_CLINICAL_PROFILES.length, 19);

  for (const profile of REQUIRED_CLINICAL_PROFILES) {
    assert.ok(
      patients.some((p) => p.clinicalProfiles?.includes(profile)),
      `Profile ${profile} must appear on at least one patient`
    );
  }

  assert.ok(summary.duplicateNhsFixtures.length >= 1, "Duplicate health system fixture required (P002/P016)");
  const patel = patients.find((p) => p.id === "P002");
  assert.ok(patel, "Patel golden-path patient P002 required");
  assert.ok(patel!.activeConditions.some((c) => /diabetes/i.test(c)));
  assert.ok(patel!.activeConditions.some((c) => /dvt|thrombosis/i.test(c)));

  const ready = assertCohortReadyForProof();
  assert.equal(ready.goldenPathPatientId, "P002");

  const sim = getSimulatedPatientCohortSummary();
  assert.ok(sim.dashboardPatients >= 25);
  assert.ok(sim.clinicalProof.meetsProfileGate);

  console.log(
    `Clinical proof cohort OK: ${summary.totalPatients} patients, ${summary.coveredProfiles.length} profiles.`
  );
}

void run();
