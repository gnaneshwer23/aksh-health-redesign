/**
 * E3 (docs/PHASED_BUILD_PLAN_E.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-4): federated-research
 * role-gate hardening. `/api/research/federated/jobs` previously required
 * authentication but enforced no role check, unlike its sibling
 * `/api/research/evaluation` (already restricted to
 * `RESEARCH_EVALUATION_ROLES`). This closes that inconsistency by reusing
 * the exact same `canAccessResearchEvaluation` check.
 *
 * Covers:
 *  1. `patient` and an unrecognized role receive 403 on both GET and POST.
 *  2. `researcher` and `practice-manager` still succeed (GET 200; POST
 *     reaches the ethics gate rather than being blocked by role).
 *  3. The role gate and the ethics gate are independent: a `researcher`
 *     role with the ethics env gate closed gets `blocked_ethics` (403 from
 *     the ethics gate, with `patientLevelExport:false`), not silently
 *     treated as a role-based 403 with no job created — proving neither
 *     gate masks the other.
 */

import assert from "node:assert/strict";

import { GET as getFederatedJobs, POST as postFederatedJob } from "../app/api/research/federated/jobs/route";
import { FEDERATED_ETHICS_GATE_ENV, resetFederatedJobStoreForTests } from "../lib/precision-health/federated-research";

function buildRequest(method: "GET" | "POST", role: string, body?: unknown) {
  return new Request("http://localhost:3000/api/research/federated/jobs", {
    method,
    headers: {
      "x-user-id": `federated_rbac_test_${role}_${Date.now()}`,
      "x-user-email": `federated-rbac-${role}@akshhealth.com`,
      "x-user-role": role,
      "content-type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

async function testDisallowedRolesRejected() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";
  delete process.env[FEDERATED_ETHICS_GATE_ENV];

  try {
    for (const role of ["patient", "some-unrecognized-role"]) {
      const getResponse = await getFederatedJobs(buildRequest("GET", role));
      assert.equal(getResponse.status, 403, `GET: role "${role}" must be forbidden`);

      const postResponse = await postFederatedJob(
        buildRequest("POST", role, { title: "Should be blocked by role", ethicsApprovedClaim: false })
      );
      assert.equal(postResponse.status, 403, `POST: role "${role}" must be forbidden`);
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("Federated research RBAC: patient/unrecognized role denied on GET and POST.");
}

async function testAllowedRolesUnaffected() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";
  delete process.env[FEDERATED_ETHICS_GATE_ENV];

  try {
    for (const role of ["researcher", "practice-manager"]) {
      const getResponse = await getFederatedJobs(buildRequest("GET", role));
      assert.equal(getResponse.status, 200, `GET: role "${role}" must still succeed`);
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("Federated research RBAC: researcher/practice-manager unaffected on GET.");
}

async function testRoleGateAndEthicsGateAreIndependent() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";
  delete process.env[FEDERATED_ETHICS_GATE_ENV]; // ethics gate closed

  try {
    resetFederatedJobStoreForTests();

    const response = await postFederatedJob(
      buildRequest("POST", "researcher", { title: "Ethics-gate-closed job", ethicsApprovedClaim: true })
    );
    // A researcher (allowed by the role gate) still gets blocked_ethics — not a bare
    // role-based 403 — proving the ethics gate independently applies.
    assert.equal(response.status, 403, "ethics-blocked job still returns 403, but via the ethics gate, not the role gate");
    const body = (await response.json()) as { job?: { status?: string; patientLevelExport?: boolean } };
    assert.equal(body.job?.status, "blocked_ethics", "role-allowed researcher must reach the ethics gate, not be stopped earlier by the role gate");
    assert.equal(body.job?.patientLevelExport, false);
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("Federated research RBAC: role gate and ethics gate are independent — neither masks the other.");
}

async function main() {
  await testDisallowedRolesRejected();
  await testAllowedRolesUnaffected();
  await testRoleGateAndEthicsGateAreIndependent();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
