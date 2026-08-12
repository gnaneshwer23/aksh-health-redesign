/**
 * Stage 4 — E2E platform RBAC negative tests (API layer).
 * Run: npm run test:e2e:platform-rbac
 */

import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { GET as getE2EAdminStatus } from "../app/api/admin/e2e/status/route";
import { POST as postCheckIn } from "../app/api/patients/[id]/check-in/route";
import { GET as getPatientState } from "../app/api/patients/[id]/state/route";
import { PUT as putReviewCase } from "../app/api/review-cases/[id]/route";
import { POST as postFederatedJob } from "../app/api/research/federated/jobs/route";
import { isE2EAdminSurfaceAllowed } from "../lib/e2e/env";
import { E2E_RBAC_NEGATIVE_CASES } from "../lib/e2e/rbac-scenarios";
import { generateE2EDataset } from "../lib/e2e/generator";

const TEST_USER = "e2e_rbac_stage4_user";
const PATIENT_A = "E2P001";
const PATIENT_B = "E2P002";

function authHeaders(role: string, extras: Record<string, string> = {}) {
  return {
    "x-user-id": TEST_USER,
    "x-user-email": "e2e-rbac-stage4@akshhealth.com",
    "x-user-role": role,
    "content-type": "application/json",
    ...extras,
  };
}

async function cleanupFiles() {
  await unlink(path.join(process.cwd(), "data", `modality-samples.${TEST_USER}.json`)).catch(() => {});
  await unlink(path.join(process.cwd(), "data", `review-cases.${TEST_USER}.json`)).catch(() => {});
}

async function run() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousUsePostgres = process.env.USE_POSTGRES;
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  const dataset = generateE2EDataset({ seed: 20260812 });
  const cohortBPatient = dataset.patients.find((p) => p.cohortId === "B");
  assert.ok(cohortBPatient, "cohort B patient required");

  try {
    // AKSH-E2E-RBAC-001 — unauthenticated patient state
    const unauthState = await getPatientState(
      new Request(`http://localhost/api/patients/${PATIENT_A}/state`),
      { params: { id: PATIENT_A } }
    );
    assert.equal(unauthState.status, 401, E2E_RBAC_NEGATIVE_CASES[0]!.testId);

    // GP may read patient state (authenticated)
    const gpState = await getPatientState(
      new Request(`http://localhost/api/patients/P002/state`, { headers: authHeaders("gp") }),
      { params: { id: "P002" } }
    );
    assert.equal(gpState.status, 200, "clinical reviewer may read patient state");

    // AKSH-E2E-RBAC-002 / 003 — HITL decision gate
    for (const role of ["patient", "researcher", "operations_lead"]) {
      const response = await putReviewCase(
        new Request("http://localhost/api/review-cases/case-e2e-rbac", {
          method: "PUT",
          headers: authHeaders(role),
          body: JSON.stringify({ id: "case-e2e-rbac", status: "accepted" }),
        }),
        { params: { id: "case-e2e-rbac" } }
      );
      assert.equal(response.status, 403, `role ${role} must not Accept review cases`);
    }

    const gpDecision = await putReviewCase(
      new Request("http://localhost/api/review-cases/case-e2e-rbac", {
        method: "PUT",
        headers: authHeaders("gp"),
        body: JSON.stringify({ id: "case-e2e-rbac", status: "accepted" }),
      }),
      { params: { id: "case-e2e-rbac" } }
    );
    assert.notEqual(gpDecision.status, 403, "gp must not hit FR-PER-009 gate");

    // AKSH-E2E-RBAC-004 — cross-patient check-in
    const crossCheckIn = await postCheckIn(
      new Request(`http://localhost/api/patients/${PATIENT_B}/check-in`, {
        method: "POST",
        headers: authHeaders("patient", { "x-bound-patient-id": PATIENT_A }),
        body: JSON.stringify({ mood: "okay" }),
      }),
      { params: { id: PATIENT_B } }
    );
    assert.equal(crossCheckIn.status, 403);
    const crossBody = (await crossCheckIn.json()) as { denied?: boolean };
    assert.equal(crossBody.denied, true);

    // AKSH-E2E-RBAC-005 — federated research patient denied
    const fedPost = await postFederatedJob(
      new Request("http://localhost/api/research/federated/jobs", {
        method: "POST",
        headers: authHeaders("patient"),
        body: JSON.stringify({ title: "blocked", ethicsApprovedClaim: false }),
      })
    );
    assert.equal(fedPost.status, 403);

    // AKSH-E2E-RBAC-006 — E2E admin production gate
    const prevNode = process.env.NODE_ENV;
    const prevVercel = process.env.VERCEL_ENV;
    const prevE2E = process.env.E2E_TEST_MODE;
    process.env.NODE_ENV = "production";
    process.env.VERCEL_ENV = "production";
    delete process.env.E2E_TEST_MODE;
    delete process.env.E2E_ADMIN_ENABLED;
    assert.equal(isE2EAdminSurfaceAllowed(), false);

    const blockedAdmin = await getE2EAdminStatus();
    assert.equal(blockedAdmin.status, 403);

    process.env.NODE_ENV = prevNode;
    process.env.VERCEL_ENV = prevVercel;
    if (prevE2E) process.env.E2E_TEST_MODE = prevE2E;
    process.env.E2E_TEST_MODE = "true";

    const allowedAdmin = await getE2EAdminStatus(
      new Request("http://localhost/api/admin/e2e/status", {
        headers: authHeaders("practice-manager"),
      })
    );
    assert.equal(allowedAdmin.status, 200);

    // AKSH-E2E-RBAC-007 — researcher denied patient state (Stage 5)
    const researcherState = await getPatientState(
      new Request("http://localhost/api/patients/P002/state", { headers: authHeaders("researcher") }),
      { params: { id: "P002" } }
    );
    assert.equal(researcherState.status, 403);

    // Cohort B trajectory sanity (golden AKSH-E2E-0002 data plane)
    const series = cohortBPatient.hba1cSeries;
    assert.ok(series.length >= 2);
    assert.ok(series[series.length - 1]!.value > series[0]!.value + 1, "cohort B must worsen");

    console.log(`E2E RBAC negative cases passed (${E2E_RBAC_NEGATIVE_CASES.length} defined).`);
    console.log(`Golden trace: AKSH-E2E-0002 ↔ cohort B patient ${cohortBPatient.id}`);
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
    if (previousUsePostgres) process.env.USE_POSTGRES = previousUsePostgres;
    await cleanupFiles();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
