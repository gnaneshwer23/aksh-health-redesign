import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  DEMO_COHORT_CORE_PATIENT_COUNT,
  DEMO_COHORT_EMAIL_DOMAIN,
  DEMO_COHORT_EXTENDED_COUNT,
  DEMO_COHORT_ID,
  DEMO_COHORT_META,
  DEMO_COHORT_MIN_COUNTS,
  DEMO_COHORT_PATIENT_TARGET,
  DEMO_COHORT_USER_TARGET,
  assertDemoCohortGeneratorInvariants,
  generateDemoCohortCareEpisodes,
  generateDemoCohortHitlDrafts,
  generateDemoCohortLearningSeeds,
  generateDemoCohortReviewQueueItems,
  generateDemoCohortUsers,
  generateExtendedDemoPatients,
  isDemoCohortTagged,
  purgeDemoCohortTaggedRows,
  summarizeDemoCohortUsers,
} from "../lib/mock-data/demo-cohort-generator";
import { patients } from "../lib/mock-data/patients";
import { reviewQueueItems } from "../lib/mock-data/review-queue";

describe("demo cohort generator (stakeholder scale)", () => {
  it("produces extended patients P027–P200 with diversity", () => {
    const extended = generateExtendedDemoPatients();
    assert.equal(extended.length, DEMO_COHORT_EXTENDED_COUNT);
    assert.equal(extended[0]?.id, "P027");
    assert.equal(extended[extended.length - 1]?.id, "P200");

    const imd = new Set(extended.map((p) => p.imdQuintile));
    const ics = new Set(extended.map((p) => p.icsRegion));
    const risks = new Set(extended.map((p) => p.oracleRisk));
    assert.equal(imd.size, 5);
    assert.ok(ics.size >= 5);
    assert.ok(risks.size >= 3);
    assert.ok(extended.every((p) => p.qaNotes?.includes("liveEmis:false")));
    assert.ok(extended.every((p) => p.qaNotes?.includes(DEMO_COHORT_ID)));
    const t2d = extended.filter((p) => p.clinicalProfiles?.includes("t2d"));
    assert.ok(t2d.length >= 8);
  });

  it("keeps P001–P026 demos and totals ≥200 patients in app mock", () => {
    assert.equal(patients.length, DEMO_COHORT_PATIENT_TARGET);
    assert.ok(patients.length >= DEMO_COHORT_MIN_COUNTS.patients);
    assert.equal(DEMO_COHORT_CORE_PATIENT_COUNT, 26);
    for (const id of ["P001", "P002", "P003", "P012", "P026", "P027", "P100", "P200"]) {
      assert.ok(patients.some((p) => p.id === id), `missing ${id}`);
    }
    const p002 = patients.find((p) => p.id === "P002");
    assert.equal(p002?.name, "Mr James Patel");
  });

  it("meets stakeholder role minimums (GP/nurse/pharmacist/lab + others)", () => {
    const users = generateDemoCohortUsers();
    assert.equal(users.length, DEMO_COHORT_USER_TARGET);
    assert.ok(users.length >= 300);
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
    assert.ok((summary.byEmailPrefix.gp ?? 0) >= DEMO_COHORT_MIN_COUNTS.gp);
    assert.ok((summary.byEmailPrefix.nurse ?? 0) >= DEMO_COHORT_MIN_COUNTS.nurse);
    assert.ok(
      (summary.byEmailPrefix.pharmacist ?? 0) >= DEMO_COHORT_MIN_COUNTS.clinicalPharmacist
    );
    assert.ok((summary.bySubRole.lab_operator ?? 0) >= DEMO_COHORT_MIN_COUNTS.labOperator);
    assert.ok(
      (summary.bySubRole.organisation_admin ?? 0) >= DEMO_COHORT_MIN_COUNTS.organisationAdmin
    );
    assert.ok((summary.bySubRole.front_desk ?? 0) >= DEMO_COHORT_MIN_COUNTS.frontDesk);
    assert.ok((summary.byEmailPrefix.ics ?? 0) >= DEMO_COHORT_MIN_COUNTS.icsLead);
    assert.ok((summary.byEmailPrefix.hospital ?? 0) >= DEMO_COHORT_MIN_COUNTS.hospitalExecutive);
    assert.ok((summary.byEmailPrefix.patient ?? 0) >= DEMO_COHORT_MIN_COUNTS.patientAccounts);
    assert.ok((summary.byEmailPrefix.researcher ?? 0) >= DEMO_COHORT_MIN_COUNTS.researcher);
    assert.ok(users.every((u) => u.email.endsWith(`@${DEMO_COHORT_EMAIL_DOMAIN}`)));
    assert.ok(users.every((u) => u.syntheticOnly && u.liveEmis === false && u.ehrWrite === false));
    assert.ok(users.every((u) => u.syntheticDemo && u.removable && u.demoCohortId === DEMO_COHORT_ID));
    assert.ok(users.every((u) => u.onboardingComplete && u.emailVerified));
  });

  it("assertDemoCohortGeneratorInvariants passes at stakeholder scale", () => {
    const result = assertDemoCohortGeneratorInvariants();
    assert.equal(result.patients, DEMO_COHORT_PATIENT_TARGET);
    assert.equal(result.users, DEMO_COHORT_USER_TARGET);
    assert.ok(result.careEpisodes >= DEMO_COHORT_MIN_COUNTS.careEpisodes);
    assert.ok(result.hitlDrafts >= DEMO_COHORT_MIN_COUNTS.labHitlDrafts + DEMO_COHORT_MIN_COUNTS.pharmacyHitlDrafts);
    assert.ok(result.reviewQueueExtras >= DEMO_COHORT_MIN_COUNTS.reviewQueueExtras);
  });

  it("seeds relational glue: care episodes, HITL drafts, review queue extras", () => {
    const episodes = generateDemoCohortCareEpisodes();
    const hitl = generateDemoCohortHitlDrafts();
    const queue = generateDemoCohortReviewQueueItems();
    assert.ok(episodes.every((e) => e.id.startsWith("ce-demo-cohort-")));
    assert.ok(episodes.every((e) => e.metadata.demoCohortId === DEMO_COHORT_ID));
    assert.ok(episodes.every((e) => e.metadata.ehrWrite === false));
    assert.ok(hitl.some((d) => d.kind === "lab" && d.id.startsWith("lph-lab-demo-cohort-")));
    assert.ok(hitl.some((d) => d.kind === "pharmacy" && d.id.startsWith("lph-pharmacy-demo-cohort-")));
    assert.ok(hitl.every((d) => d.ehrWrite === false && d.live === false));
    assert.ok(queue.every((q) => q.id.startsWith("RQ-demo-cohort-")));
    assert.ok(reviewQueueItems.some((q) => q.id === "RQ001"));
    assert.ok(reviewQueueItems.some((q) => q.id.startsWith("RQ-demo-cohort-")));
  });

  it("learning seeds link care actions without auto-retrain claims", () => {
    const seeds = generateDemoCohortLearningSeeds(20);
    assert.equal(seeds.length, 20);
    assert.ok(seeds.every((s) => /^P\d{3}$/.test(s.patientId)));
    assert.ok(seeds.every((s) => s.linkOutcomeSummary.includes("liveEmis:false")));
    assert.ok(seeds.every((s) => s.linkOutcomeSummary.includes("autoRetrain:false")));
  });

  it("purge removes only tagged demo rows (hermetic)", () => {
    const mixed = [
      { id: "ce-keep-real" },
      { id: "ce-demo-cohort-001" },
      { id: "lph-lab-demo-cohort-002" },
      { id: "learn-other-001" },
      { id: "learn-demo-cohort-003" },
      { id: "RQ-demo-cohort-004" },
      { id: "RQ001" },
    ];
    const { retained, purged } = purgeDemoCohortTaggedRows(mixed);
    assert.equal(purged.length, 4);
    assert.equal(retained.length, 3);
    assert.ok(retained.every((r) => !isDemoCohortTagged(r)));
    assert.ok(isDemoCohortTagged({ email: `gp01@${DEMO_COHORT_EMAIL_DOMAIN}` }));
    assert.ok(isDemoCohortTagged({ demoCohortId: DEMO_COHORT_ID }));
    assert.equal(DEMO_COHORT_META.syntheticDemo, true);
    assert.equal(DEMO_COHORT_META.removable, true);
    assert.equal(DEMO_COHORT_META.productionRbacEnforced, false);
  });

  it("documents seed/purge without embedding any password", () => {
    const creds = readFileSync(
      path.join(process.cwd(), "docs/DEMO_LAUNCH_CREDENTIALS.md"),
      "utf8"
    );
    const seedDoc = readFileSync(path.join(process.cwd(), "docs/DEMO_COHORT_SEED.md"), "utf8");
    const launch = readFileSync(
      path.join(process.cwd(), "docs/launch/LAUNCH_READINESS.md"),
      "utf8"
    );
    assert.match(creds, /demo\.akshhealth\.com/);
    assert.match(creds, /seed:demo-cohort/);
    assert.match(creds, /DEMO_SEED_PASSWORD|DEMO_COHORT_PASSWORD/);
    assert.doesNotMatch(creds, /AkshDemoCohort/);
    assert.match(seedDoc, /purge:demo-cohort/);
    assert.match(seedDoc, /P027–P200|\*\*200\*\*|200 patients|≥200/);
    assert.match(seedDoc, /lab01@/);
    assert.match(launch, /Must-have before any \*\*external demo\*\*/);
    assert.match(launch, /Must-have before \*\*clinical production\*\*/);
    assert.match(launch, /productionRbacEnforced/);
    assert.match(launch, /Not clinical production ready/);
    assert.doesNotMatch(launch, /Ready for clinical production\?\s*\|\s*\*\*Yes/i);
  });

  it("wires npm scripts for seed and purge", () => {
    const pkg = JSON.parse(readFileSync(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    assert.match(pkg.scripts["seed:demo-cohort"] ?? "", /seed-demo-cohort/);
    assert.match(pkg.scripts["purge:demo-cohort"] ?? "", /purge-demo-cohort/);
    assert.match(pkg.scripts["test:demo-cohort"] ?? "", /demo-cohort-generator/);
  });

  it("Agent Ops surfaces synthetic demo cohort honesty", () => {
    const ops = readFileSync(
      path.join(process.cwd(), "app/dashboard/admin/agent-ops/page.tsx"),
      "utf8"
    );
    assert.match(ops, /demo-cohort-synthetic-honesty/);
    assert.match(ops, /productionRbacEnforced:\s*false/);
    assert.match(ops, /purge:demo-cohort/);
    assert.doesNotMatch(ops, /productionRbacEnforced\s*[:=]\s*true/);
  });
});
