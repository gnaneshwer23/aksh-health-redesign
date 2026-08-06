import assert from "node:assert/strict";

import { getRoleDefinition, type UserRole } from "../lib/onboarding/roles";
import { mapSessionRoleToAppRole } from "../lib/user-scope";

function isAllowed(pathname: string, role: UserRole) {
  const definition = getRoleDefinition(role);
  if (!definition) return false;
  if (pathname === definition.dashboardPath || pathname.startsWith(`${definition.dashboardPath}/`)) {
    return true;
  }
  return (
    definition.alternateDashboardPaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    ) ?? false
  );
}

function checkDashboardPathMatrix() {
  const gp: UserRole = "gp";
  const nurse: UserRole = "nurse";
  const admin: UserRole = "practice-manager";
  const ics: UserRole = "ics-lead";
  const patient: UserRole = "patient";
  const researcher: UserRole = "researcher";

  assert.equal(isAllowed("/dashboard/gp", gp), true);
  assert.equal(isAllowed("/dashboard/gp/review-queue", gp), true);
  assert.equal(isAllowed("/dashboard/admin", gp), false);

  assert.equal(isAllowed("/dashboard/nurse", nurse), true);
  assert.equal(isAllowed("/dashboard/gp", nurse), false);

  assert.equal(isAllowed("/dashboard/admin", admin), true);
  assert.equal(isAllowed("/dashboard/gp", admin), false);

  assert.equal(isAllowed("/dashboard/ics", ics), true);
  assert.equal(isAllowed("/dashboard/patient", patient), true);
  assert.equal(isAllowed("/dashboard/researcher", researcher), true);
  assert.equal(isAllowed("/dashboard/admin", researcher), false);

  console.log("RBAC dashboard path matrix checks passed.");
}

/**
 * B1 / OQ-PER-1 / OQ-PER-2: `patient` and `researcher` sessions must map to their own
 * first-class `AppRole`s, never fall through to `clinical_reviewer`. Unrecognized roles
 * must deny-by-default to `restricted`, not silently promote to a clinical/ops AppRole.
 */
function checkAppRoleMapping() {
  assert.notEqual(mapSessionRoleToAppRole("patient"), "clinical_reviewer");
  assert.equal(mapSessionRoleToAppRole("patient"), "patient");

  assert.notEqual(mapSessionRoleToAppRole("researcher"), "clinical_reviewer");
  assert.equal(mapSessionRoleToAppRole("researcher"), "researcher");

  // Existing clinical/ops mappings must be unaffected (additive change only).
  assert.equal(mapSessionRoleToAppRole("gp"), "clinical_reviewer");
  assert.equal(mapSessionRoleToAppRole("nurse"), "clinical_reviewer");
  assert.equal(mapSessionRoleToAppRole("clinical-pharmacist"), "clinical_reviewer");
  assert.equal(mapSessionRoleToAppRole("practice-manager"), "operations_lead");
  assert.equal(mapSessionRoleToAppRole("ics-lead"), "operations_lead");
  assert.equal(mapSessionRoleToAppRole("hospital-executive"), "operations_lead");
  assert.equal(mapSessionRoleToAppRole("operations_lead"), "operations_lead");
  assert.equal(mapSessionRoleToAppRole("clinical_reviewer"), "clinical_reviewer");

  // No silent default: any unrecognized/unmapped role must deny-by-default, not promote.
  assert.equal(mapSessionRoleToAppRole("some-made-up-role"), "restricted");
  assert.equal(mapSessionRoleToAppRole(null), "restricted");
  assert.equal(mapSessionRoleToAppRole(undefined), "restricted");
  assert.equal(mapSessionRoleToAppRole(""), "restricted");

  console.log("AppRole mapping checks passed (patient/researcher no longer fall through).");
}

// FR-PER-009 (non-clinical persona cannot record an Accept/Edit/Reject) is covered in
// `tests/clinical-proof-rbac-decision-gate.test.ts`, run via `tsx` because it imports
// `app/api/review-cases/[id]/route.ts`, which uses `@/`-aliased imports that this file's
// tsc-compiled commonjs bundle cannot resolve at runtime.
function run() {
  checkDashboardPathMatrix();
  checkAppRoleMapping();
}

void run();
