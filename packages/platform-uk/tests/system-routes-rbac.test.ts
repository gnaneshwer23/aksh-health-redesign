/**
 * E2 (docs/PHASED_BUILD_PLAN_E.md, implements
 * docs/AKSH_ARCHITECTURE_MIGRATION_PLAN.md P3-2): production RBAC hardening
 * for three `/api/system/*` routes that previously required authentication
 * but enforced no role check (`audit-integrity`, `permission-matrix`,
 * `clinical-safety-files`) — any authenticated role, including
 * patient/researcher, could previously call them directly.
 *
 * `integration-contract`/`database-contract` are deliberately NOT covered
 * here — they stay intentionally public (linked from the public /security
 * page; locked in by tests/readonly-route-contracts.test.ts's own "should
 * be public read-only without session" assertion) and this phase does not
 * change that.
 *
 * Covers:
 *  1. `patient`, `researcher`, an unrecognized role, and an unauthenticated
 *     request are all denied (401/403) on all three routes.
 *  2. `gp` (→ clinical_reviewer) and `practice-manager` (→ operations_lead)
 *     both still succeed on all three routes — zero regression for the
 *     roles the matrix always intended to allow.
 *  3. `productionRbacEnforced` remains `false` in the permission-matrix
 *     route's own response (this phase hardens individual routes; it does
 *     not claim full production RBAC enforcement).
 */

import assert from "node:assert/strict";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { GET as getAuditIntegrity } from "../app/api/system/audit-integrity/route";
import { GET as getClinicalSafetyFiles } from "../app/api/system/clinical-safety-files/route";
import { GET as getPermissionMatrix } from "../app/api/system/permission-matrix/route";

const seededScopeFiles: string[] = [];

/**
 * `audit-integrity`'s allowed-role assertions call the real route, which
 * reads through `readReviewCases(scopeKey)` — this seeds a per-scope demo
 * dataset file on first access for a new scopeKey (mirrors the same cleanup
 * need documented in `tests/clinical-proof-rbac-decision-gate.test.ts`).
 * Clean these up so repeated runs stay hermetic and nothing stray is left
 * for git to pick up.
 */
async function cleanupSeededScopeFiles() {
  await Promise.all(
    seededScopeFiles.map((fileName) => unlink(path.join(process.cwd(), "data", fileName)).catch(() => {}))
  );
}

const ROUTES: Array<{ name: string; handler: (request: Request) => Promise<Response> }> = [
  { name: "audit-integrity", handler: getAuditIntegrity },
  { name: "permission-matrix", handler: getPermissionMatrix },
  { name: "clinical-safety-files", handler: getClinicalSafetyFiles }
];

function buildRequest(role: string | null, userIdSuffix: string) {
  const headers: Record<string, string> = {};
  if (role !== null) {
    headers["x-user-id"] = `system_rbac_test_${userIdSuffix}`;
    headers["x-user-email"] = `system-rbac-${userIdSuffix}@akshhealth.com`;
    headers["x-user-role"] = role;
  }
  return new Request("http://localhost:3000/api/system/test-route", { headers });
}

async function testDeniedRolesRejected() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    for (const route of ROUTES) {
      for (const role of ["patient", "researcher", "some-unrecognized-role"]) {
        const response = await route.handler(buildRequest(role, `${route.name}_${role}`));
        assert.equal(
          response.status,
          403,
          `${route.name}: role "${role}" must be forbidden (E2 hardening)`
        );
      }

      const unauthenticated = await route.handler(buildRequest(null, `${route.name}_none`));
      assert.equal(unauthenticated.status, 401, `${route.name}: unauthenticated request must be rejected`);
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("System routes RBAC: patient/researcher/unrecognized/unauthenticated all denied on audit-integrity, permission-matrix, clinical-safety-files.");
}

async function testAllowedRolesUnaffected() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    for (const route of ROUTES) {
      for (const role of ["gp", "practice-manager"]) {
        const userIdSuffix = `${route.name}_${role}`;
        if (route.name === "audit-integrity") {
          seededScopeFiles.push(`review-cases.system_rbac_test_${userIdSuffix}.json`);
        }
        const response = await route.handler(buildRequest(role, userIdSuffix));
        assert.equal(
          response.status,
          200,
          `${route.name}: role "${role}" (clinical_reviewer/operations_lead) must still succeed — zero regression`
        );
      }
    }
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
    await cleanupSeededScopeFiles();
  }

  console.log("System routes RBAC: gp/practice-manager (clinical_reviewer/operations_lead) unaffected on all three routes.");
}

async function testProductionRbacStillFalse() {
  process.env.AKSH_TEST_AUTH_HEADER = "true";

  try {
    const response = await getPermissionMatrix(buildRequest("gp", "production_rbac_check"));
    assert.equal(response.status, 200);
    const body = (await response.json()) as { productionRbacEnforced?: boolean };
    assert.equal(body.productionRbacEnforced, false, "E2 must not flip productionRbacEnforced to true");
  } finally {
    delete process.env.AKSH_TEST_AUTH_HEADER;
  }

  console.log("System routes RBAC: productionRbacEnforced remains false after E2 hardening.");
}

async function main() {
  await testDeniedRolesRejected();
  await testAllowedRolesUnaffected();
  await testProductionRbacStillFalse();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
