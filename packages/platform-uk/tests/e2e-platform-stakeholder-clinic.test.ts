/**
 * Simulated multi-stakeholder diabetes clinic — publication gate.
 * Run: npx tsx tests/e2e-platform-stakeholder-clinic.test.ts
 */

import assert from "node:assert/strict";

import { generateE2EDataset } from "../lib/e2e/generator";
import { runStakeholderClinic } from "../lib/e2e/stakeholder-clinic";

async function run() {
  const dataset = generateE2EDataset({ seed: 20260812 });
  const patient = dataset.patients.find((p) => p.id === "P002");
  assert.ok(patient, "flagship P002 required");

  const clinic = runStakeholderClinic({
    dataset,
    patient,
    correlationId: "aksh-clinic-test-20260812",
    cgmPatient: dataset.patients.find((p) => p.cohortId === "D") ?? null,
    pharmacyPatient: dataset.patients.find((p) => p.cohortId === "E") ?? null,
    labPatient: dataset.patients.find((p) => p.cohortId === "F") ?? null,
  });

  assert.equal(clinic.artifactType, "aksh-e2e-stakeholder-clinic");
  assert.equal(clinic.regionAgnostic, true);
  assert.equal(clinic.liveEmis, false);
  assert.equal(clinic.ehrWrite, false);
  assert.equal(clinic.overall, "PASS", clinic.failures.join("; "));
  assert.equal(clinic.activityMatrix.length, 10);
  assert.ok(clinic.activityMatrix.every((r) => r.canComplete));

  // Region-agnostic org fields on generator
  const org = dataset.organisations.find((o) => o.id === clinic.organisationId);
  assert.ok(org);
  assert.equal(org!.organisationCode, org!.odsCode);
  assert.equal(org!.regionId, org!.icsRegion);
  assert.equal(patient.nationalPatientId, patient.nhsNumber);

  console.log(
    `Stakeholder clinic PASS — roles=${clinic.activityMatrix.map((r) => r.role).join(",")}`
  );
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});
