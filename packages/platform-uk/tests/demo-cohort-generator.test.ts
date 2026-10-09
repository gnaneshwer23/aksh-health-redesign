import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  DEMO_COHORT_CORE_PATIENT_COUNT,
  DEMO_COHORT_DEFAULT_PASSWORD,
  DEMO_COHORT_EMAIL_DOMAIN,
  DEMO_COHORT_EXTENDED_COUNT,
  DEMO_COHORT_PATIENT_TARGET,
  DEMO_COHORT_USER_TARGET,
  assertDemoCohortGeneratorInvariants,
  generateDemoCohortLearningSeeds,
  generateDemoCohortUsers,
  generateExtendedDemoPatients,
  summarizeDemoCohortUsers,
} from "../lib/mock-data/demo-cohort-generator";
import { patients } from "../lib/mock-data/patients";

describe("demo cohort generator", () => {
  it("produces 74 extended patients P027–P100 with diversity", () => {
    const extended = generateExtendedDemoPatients();
    assert.equal(extended.length, DEMO_COHORT_EXTENDED_COUNT);
    assert.equal(extended[0]?.id, "P027");
    assert.equal(extended[extended.length - 1]?.id, "P100");

    const imd = new Set(extended.map((p) => p.imdQuintile));
    const ics = new Set(extended.map((p) => p.icsRegion));
    const risks = new Set(extended.map((p) => p.oracleRisk));
    assert.equal(imd.size, 5);
    assert.ok(ics.size >= 5);
    assert.ok(risks.size >= 3);
    assert.ok(extended.every((p) => p.qaNotes?.includes("liveEmis:false")));
    const t2d = extended.filter((p) => p.clinicalProfiles?.includes("t2d"));
    assert.ok(t2d.length >= 8);
    assert.ok(
      t2d.some((p) =>
        p.digitalTwinPrediction.deteriorationSignals.some((s) => /HbA1c series/.test(s))
      )
    );
    assert.ok(extended.some((p) => p.qaNotes?.includes("draftSeed:")));
  });

  it("keeps P001–P012 demos and totals 100 patients in app mock", () => {
    assert.equal(patients.length, DEMO_COHORT_PATIENT_TARGET);
    assert.equal(DEMO_COHORT_CORE_PATIENT_COUNT, 26);
    for (const id of ["P001", "P002", "P003", "P012", "P026", "P027", "P100"]) {
      assert.ok(patients.some((p) => p.id === id), `missing ${id}`);
    }
    const p002 = patients.find((p) => p.id === "P002");
    assert.equal(p002?.name, "Mr James Patel");
    assert.ok(p002?.activeMedications.some((m) => /Aspirin/i.test(m)));
    assert.ok(p002?.activeMedications.some((m) => /Apixaban/i.test(m)));
    assert.match(p002?.qaNotes ?? "", /51→68 mmol\/mol/);
  });

  it("produces 100 users across all 8 roles", () => {
    const users = generateDemoCohortUsers();
    assert.equal(users.length, DEMO_COHORT_USER_TARGET);
    const summary = summarizeDemoCohortUsers(users);
    assert.deepEqual(summary.rolesRepresented.sort(), [
      "clinical-pharmacist",
      "gp",
      "hospital-executive",
      "ics-lead",
      "nurse",
      "patient",
      "practice-manager",
      "researcher",
    ]);
    assert.equal(summary.byRole.gp, 20);
    assert.equal(summary.byRole.nurse, 15);
    assert.ok(users.every((u) => u.email.endsWith(`@${DEMO_COHORT_EMAIL_DOMAIN}`)));
    assert.ok(users.every((u) => u.syntheticOnly && u.liveEmis === false));
    assert.ok(users.every((u) => u.onboardingComplete && u.emailVerified));
  });

  it("assertDemoCohortGeneratorInvariants passes", () => {
    const result = assertDemoCohortGeneratorInvariants();
    assert.equal(result.patients, 100);
    assert.equal(result.users, 100);
  });

  it("learning seeds link care actions to patient ids without auto-retrain claims", () => {
    const seeds = generateDemoCohortLearningSeeds(20);
    assert.equal(seeds.length, 20);
    assert.ok(seeds.every((s) => /^P0\d{2}$/.test(s.patientId)));
    assert.ok(seeds.every((s) => s.linkOutcomeSummary.includes("liveEmis:false")));
    assert.ok(seeds.every((s) => s.linkOutcomeSummary.includes("autoRetrain:false")));
  });

  it("documents shared demo password without embedding production secrets", () => {
    assert.ok(DEMO_COHORT_DEFAULT_PASSWORD.length >= 12);
    const creds = readFileSync(
      path.join(process.cwd(), "docs/DEMO_LAUNCH_CREDENTIALS.md"),
      "utf8"
    );
    assert.match(creds, /demo\.akshhealth\.com/);
    assert.match(creds, /seed:demo-cohort/);
    assert.match(creds, /AkshDemoCohort!2026/);
  });
});
