/**
 * U3 — Personalised onboarding role paths.
 * Ensures all 8 roles have tutorial + dashboard routing + honesty locks.
 */
import assert from "node:assert/strict";

import {
  ALL_ONBOARDING_ROLES,
  buildPreferenceTips,
  getRoleOnboardingPath,
  ROLE_ONBOARDING_PATHS,
} from "../lib/onboarding/role-paths";
import { ROLES, resolveDashboardPath, type UserRole } from "../lib/onboarding/roles";
import {
  FIRST_RUN_BY_DASHBOARD,
  ROLE_DASHBOARD_PREVIEW,
  dashboardRoleFromUserRole,
  resolveFirstRunCopy,
} from "../lib/product-journey";

const EXPECTED_ROLES: UserRole[] = [
  "gp",
  "nurse",
  "clinical-pharmacist",
  "practice-manager",
  "ics-lead",
  "hospital-executive",
  "patient",
  "researcher",
];

const EXPECTED_DASHBOARDS: Record<UserRole, string> = {
  gp: "/dashboard/gp",
  nurse: "/dashboard/nurse",
  "clinical-pharmacist": "/dashboard/pharmacist",
  "practice-manager": "/dashboard/admin",
  "ics-lead": "/dashboard/ics",
  "hospital-executive": "/dashboard/hospital",
  patient: "/dashboard/patient",
  researcher: "/dashboard/researcher",
};

function run() {
  assert.deepEqual([...ALL_ONBOARDING_ROLES].sort(), [...EXPECTED_ROLES].sort());
  assert.equal(ROLES.length, 8);

  for (const role of EXPECTED_ROLES) {
    const def = ROLES.find((r) => r.id === role);
    assert.ok(def, `missing role definition: ${role}`);
    assert.equal(def.hasTutorial, true, `${role} must have tutorial`);
    assert.ok(def.steps.includes("tutorial"), `${role} steps must include tutorial`);
    assert.ok(def.steps.includes("complete"), `${role} steps must include complete`);
    assert.equal(resolveDashboardPath(role), EXPECTED_DASHBOARDS[role]);

    const path = getRoleOnboardingPath(role);
    assert.ok(path, `missing onboarding path: ${role}`);
    assert.ok(path.agents.length >= 3, `${role} needs agent map`);
    assert.ok(path.youApprove.length > 20, `${role} needs youApprove copy`);
    assert.match(path.honestyNote, /liveEmis:false/);
    assert.ok(path.tutorialScreens.length >= 2, `${role} needs ≥2 tutorial screens`);
    for (const screen of path.tutorialScreens) {
      assert.ok(screen.title.trim());
      assert.ok(screen.body.trim());
    }

    const preview = ROLE_DASHBOARD_PREVIEW[role];
    assert.ok(preview);
    assert.match(preview.honesty ?? "", /liveEmis:false/);
    assert.ok(!(preview.bullets.join(" ").includes("ORACLE")), `${role} must not say ORACLE`);

    const dashRole = dashboardRoleFromUserRole(role);
    assert.ok(dashRole);
    assert.equal(path.dashboardRole, dashRole);
    assert.ok(FIRST_RUN_BY_DASHBOARD[dashRole]);
    assert.match(FIRST_RUN_BY_DASHBOARD[dashRole].honesty ?? "", /liveEmis:false/);
  }

  // Researcher ATLAS Phase 2 honesty
  const researcher = ROLE_ONBOARDING_PATHS.researcher;
  assert.ok(researcher.agents.some((a) => a.name === "ATLAS" && a.badge === "phase2"));
  assert.match(researcher.honestyNote, /ATLAS/);

  // GP VOICE / Dr.Assist sub-caps
  const gp = ROLE_ONBOARDING_PATHS.gp;
  assert.ok(gp.agents.some((a) => a.name === "VOICE" && a.badge === "subcap"));
  assert.ok(gp.agents.some((a) => a.name === "Dr.Assist" && a.badge === "subcap"));

  // Preference tips wire into first-run
  const tips = buildPreferenceTips("gp", { oracleAlerts: "High risk only" });
  assert.ok(tips.some((t) => /HORIZON/i.test(t)));

  const firstRun = resolveFirstRunCopy("gp", {
    userRole: "gp",
    preferences: { oracleAlerts: "High risk only" },
  });
  assert.match(firstRun.body, /HORIZON|high-risk/i);
  assert.match(firstRun.honesty ?? "", /liveEmis:false/);
  assert.equal(FIRST_RUN_BY_DASHBOARD.gp.primaryHref, "/dashboard/gp/review-queue");
  assert.equal(FIRST_RUN_BY_DASHBOARD.gp.secondaryHref, "/demo/script");
  assert.ok(FIRST_RUN_BY_DASHBOARD.gp.agents?.includes("CANVAS"));
  assert.ok(FIRST_RUN_BY_DASHBOARD.gp.agents?.includes("CONDUCTOR"));
  assert.match(FIRST_RUN_BY_DASHBOARD.gp.body, /Accept|BRIDGE|export/i);

  // No path claims live EMIS certification
  for (const role of EXPECTED_ROLES) {
    const blob = JSON.stringify(ROLE_ONBOARDING_PATHS[role]);
    assert.ok(!/liveEmis:\s*true/i.test(blob));
    assert.ok(!/certified\s*EMIS/i.test(blob));
    assert.ok(!/live PAS\/EPR feed/i.test(blob) || /not a live PAS/i.test(blob));
  }

  console.log("U3 onboarding role-path checks passed.");
}

void run();
