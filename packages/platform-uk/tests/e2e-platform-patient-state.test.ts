/**
 * Stage 5 — Patient State assertions at scale for E2E synthetic cohort.
 * Run: npm run test:e2e:platform-state
 */

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { GET as getPatientState } from "../app/api/patients/[id]/state/route";
import { generateE2EDataset } from "../lib/e2e/generator";
import {
  assertAllE2EPatientStates,
  assertE2EPatientState,
  projectE2EFactsForPatient,
} from "../lib/e2e/patient-state-assertions";
import type { E2EPatientStateFactSeed } from "../lib/e2e/types";

const SEED = 20260812;

async function loadArtifactFacts(): Promise<E2EPatientStateFactSeed[] | null> {
  try {
    const latest = JSON.parse(
      await readFile(path.join(process.cwd(), "data", "e2e", "latest-batch.json"), "utf8")
    ) as { batchId: string };
    return JSON.parse(
      await readFile(path.join(process.cwd(), "data", "e2e", latest.batchId, "patientStateFacts.json"), "utf8")
    ) as E2EPatientStateFactSeed[];
  } catch {
    return null;
  }
}

function authHeaders(role: string, extras: Record<string, string> = {}) {
  return {
    "x-user-id": "e2e_pstate_stage5",
    "x-user-email": "e2e-pstate@akshhealth.com",
    "x-user-role": role,
    ...extras,
  };
}

async function testAllPatientsPassAssertions() {
  const dataset = generateE2EDataset({ seed: SEED });
  const { failed, passCount, total } = assertAllE2EPatientStates(
    dataset.patients,
    dataset.patientStateFacts
  );

  if (failed.length > 0) {
    const sample = failed.slice(0, 5).map((f) => `${f.patientId}: ${f.errors.join("; ")}`);
    throw new Error(`${failed.length}/${total} patient state assertions failed. Sample: ${sample.join(" | ")}`);
  }

  assert.equal(passCount, 100);
  console.log(`Patient State scale: ${passCount}/${total} cohort assertions passed (generator).`);
}

async function testArtifactFactsIfPresent() {
  const artifactFacts = await loadArtifactFacts();
  if (!artifactFacts) {
    console.log("Patient State scale: no seeded artifact facts — skipped artifact parity check.");
    return;
  }

  const dataset = generateE2EDataset({ seed: SEED });
  assert.equal(artifactFacts.length, dataset.patientStateFacts.length, "artifact fact count matches generator");
  console.log(`Patient State scale: artifact parity OK (${artifactFacts.length} facts).`);
}

async function testCohortSamples() {
  const dataset = generateE2EDataset({ seed: SEED });
  const byCohort = (id: string) => dataset.patients.find((p) => p.cohortId === id)!;

  for (const cohortId of ["A", "B", "C", "D", "F", "H"] as const) {
    const patient = byCohort(cohortId);
    const result = assertE2EPatientState(patient, dataset.patientStateFacts);
    assert.ok(result.ok, `cohort ${cohortId} sample ${patient.id}: ${result.errors.join(", ")}`);
  }

  const cohortF = byCohort("F");
  const snapshotF = projectE2EFactsForPatient(cohortF.id, dataset.patientStateFacts);
  assert.equal(snapshotF.current.hba1c, undefined, "cohort F must not project current hba1c");

  const cohortD = byCohort("D");
  const snapshotD = projectE2EFactsForPatient(cohortD.id, dataset.patientStateFacts);
  assert.ok(snapshotD.current.cgm_summary, "cohort D must have cgm_summary fact");

  console.log("Patient State scale: per-cohort sample assertions passed.");
}

async function testStateRouteRbac() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousUsePostgres = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    const researcher = await getPatientState(
      new Request("http://localhost/api/patients/P002/state", { headers: authHeaders("researcher") }),
      { params: { id: "P002" } }
    );
    assert.equal(researcher.status, 403);

    const crossPatient = await getPatientState(
      new Request("http://localhost/api/patients/P003/state", {
        headers: authHeaders("patient", { "x-bound-patient-id": "P002" }),
      }),
      { params: { id: "P003" } }
    );
    assert.equal(crossPatient.status, 403);

    const gp = await getPatientState(
      new Request("http://localhost/api/patients/P002/state", { headers: authHeaders("gp") }),
      { params: { id: "P002" } }
    );
    assert.equal(gp.status, 200);

    console.log("Patient State API RBAC: researcher denied, cross-patient denied, gp allowed.");
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousUsePostgres) process.env.USE_POSTGRES = previousUsePostgres;
  }
}

async function run() {
  await testAllPatientsPassAssertions();
  await testArtifactFactsIfPresent();
  await testCohortSamples();
  await testStateRouteRbac();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
