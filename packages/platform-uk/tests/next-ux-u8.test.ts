/**
 * U8 — Patient + researcher dashboard demo polish.
 * Patient: My Health → care plan → consent; invite-by-practice; clinicians keep HITL; synthetic.
 * Researcher: ethics → evaluation → data access; ATLAS Phase 2; COMPASS / SHIELD supporting.
 * First-run + demo script aligned; honesty: liveEmis:false.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { FIRST_RUN_BY_DASHBOARD, ROLE_DASHBOARD_PREVIEW } from "../lib/product-journey";
import { ROLE_ONBOARDING_PATHS } from "../lib/onboarding/role-paths";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function run() {
  const patientHero = read("components/dashboard/patient/PatientHeroDemoPath.tsx");
  assert.ok(patientHero.includes("patient-hero-demo-path"));
  assert.ok(patientHero.includes("#companion-my-health"));
  assert.ok(patientHero.includes("#companion-care-plan"));
  assert.ok(patientHero.includes("#companion-consent"));
  assert.ok(patientHero.includes("/demo/script"));
  assert.ok(patientHero.includes("liveEmis:false"));
  assert.ok(patientHero.includes("invite-by-practice"));
  assert.ok(patientHero.includes("HITL") || patientHero.includes("clinicians keep"));
  assert.ok(patientHero.includes("synthetic"));

  const researcherHero = read("components/dashboard/researcher/ResearcherHeroDemoPath.tsx");
  assert.ok(researcherHero.includes("researcher-hero-demo-path"));
  assert.ok(researcherHero.includes("/dashboard/researcher"));
  assert.ok(researcherHero.includes("/dashboard/researcher/evaluation"));
  assert.ok(researcherHero.includes("/dashboard/researcher/data-access"));
  assert.ok(researcherHero.includes("/demo/script"));
  assert.ok(researcherHero.includes("liveEmis:false"));
  assert.ok(researcherHero.includes("ATLAS Phase 2"));
  assert.ok(researcherHero.includes("COMPASS"));
  assert.ok(researcherHero.includes("SHIELD"));
  assert.ok(!researcherHero.includes("ATLAS live") && !researcherHero.includes("live ATLAS"));
  assert.ok(
    researcherHero.includes("aksh-researcher-hero-demo-dismissed") ||
      researcherHero.includes("useDismissibleDemo")
  );

  const companion = read("components/dashboard/PatientCompanion.tsx");
  assert.ok(companion.includes("PatientHeroDemoPath"));
  assert.ok(companion.includes("patient-honesty-banner"));
  assert.ok(companion.includes("liveEmis:false"));
  assert.ok(companion.includes("companion-my-health"));
  assert.ok(companion.includes("companion-care-plan"));
  assert.ok(companion.includes("companion-consent"));
  assert.ok(companion.includes("invite-by-practice") || companion.includes("Practice-invited"));

  const researcherPage = read("app/dashboard/researcher/page.tsx");
  assert.ok(researcherPage.includes("researcher-honesty-banner"));
  assert.ok(researcherPage.includes("ATLAS Phase 2"));
  assert.ok(researcherPage.includes("liveEmis:false"));
  assert.ok(researcherPage.includes("AggregateAskStub"));
  assert.ok(researcherPage.includes("researcher-ethics-empty") || researcherPage.includes("ethics not signed"));

  const researcherLayout = read("app/dashboard/researcher/layout.tsx");
  assert.ok(researcherLayout.includes("ResearcherHeroDemoPath"));

  // First-run aligned with hero beats
  const patientFirst = FIRST_RUN_BY_DASHBOARD.patient;
  assert.ok(patientFirst.primaryHref.includes("/dashboard/patient"));
  assert.equal(patientFirst.secondaryHref, "/demo/script");
  assert.match(patientFirst.body, /My Health|care plan|consent/i);
  assert.match(patientFirst.honesty ?? "", /liveEmis:false/);
  assert.ok(patientFirst.agents?.includes("SHIELD"));

  const researcherFirst = FIRST_RUN_BY_DASHBOARD.researcher;
  assert.equal(researcherFirst.primaryHref, "/dashboard/researcher");
  assert.equal(researcherFirst.secondaryHref, "/demo/script");
  assert.match(researcherFirst.body, /ethics|evaluation|ATLAS/i);
  assert.match(researcherFirst.honesty ?? "", /liveEmis:false/);
  assert.ok(researcherFirst.agents?.includes("ATLAS"));
  assert.ok(researcherFirst.agents?.includes("COMPASS"));

  assert.match(ROLE_DASHBOARD_PREVIEW.patient.honesty ?? "", /liveEmis:false/);
  assert.match(ROLE_DASHBOARD_PREVIEW.patient.firstFocus, /My Health|care plan|consent/i);
  assert.match(ROLE_DASHBOARD_PREVIEW.researcher.honesty ?? "", /ATLAS|liveEmis:false/);
  assert.match(ROLE_DASHBOARD_PREVIEW.researcher.firstFocus, /ethics|evaluation/i);

  assert.match(ROLE_ONBOARDING_PATHS.patient.pathPromise, /My Health|care plan|consent|HITL/i);
  assert.match(ROLE_ONBOARDING_PATHS.researcher.pathPromise, /Ethics|evaluation|ATLAS/i);
  assert.ok(ROLE_ONBOARDING_PATHS.researcher.agents.some((a) => a.name === "ATLAS" && a.badge === "phase2"));

  // Demo script panels
  const demoScript = read("components/demo/DemoLaunchScript.tsx");
  assert.ok(demoScript.includes("patient-hero-script-panel"));
  assert.ok(demoScript.includes("researcher-hero-script-panel"));
  assert.ok(demoScript.includes("/dashboard/patient"));
  assert.ok(demoScript.includes("/dashboard/researcher"));
  assert.ok(demoScript.includes("liveEmis: false") || demoScript.includes("liveEmis:false"));
  assert.ok(demoScript.includes("ATLAS Phase 2") || demoScript.includes("ATLAS stays Phase 2"));
  assert.ok(demoScript.includes("01:35"));
  assert.ok(demoScript.includes("01:45"));
  assert.ok(!demoScript.includes("14 agents"));

  // Smoke scripts assert hero copy
  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-patient-dashboard.mjs")));
  const patientSmoke = read("scripts/smoke-patient-dashboard.mjs");
  assert.ok(patientSmoke.includes("Companion demo"));
  assert.ok(patientSmoke.includes("liveEmis:false"));
  assert.ok(patientSmoke.includes("invite-by-practice"));

  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-researcher-dashboard.mjs")));
  const researcherSmoke = read("scripts/smoke-researcher-dashboard.mjs");
  assert.ok(researcherSmoke.includes("Research Cohort Overview"));
  assert.ok(researcherSmoke.includes("liveEmis:false"));
  assert.ok(researcherSmoke.includes("ATLAS Phase 2"));

  assert.ok(!patientHero.includes("liveEmis:true"));
  assert.ok(!researcherHero.includes("liveEmis:true"));
  assert.ok(!companion.includes("liveEmis:true"));
  assert.ok(!researcherPage.includes("liveEmis:true"));

  console.log("U8 patient + researcher dashboard demo polish checks passed.");
}

void run();
