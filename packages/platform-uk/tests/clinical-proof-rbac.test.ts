import assert from "node:assert/strict";

import { getRoleDefinition, type UserRole } from "../lib/onboarding/roles";

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

function run() {
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

void run();
