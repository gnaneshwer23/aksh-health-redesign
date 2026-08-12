/**
 * U5 — Nurse + pharmacist dashboard demo polish.
 * 3-beat nurse path; pharmacist med-safety HITL; first-run + demo script aligned;
 * honesty: synthetic · liveEmis:false · Phase D spine APIs referenced.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { FIRST_RUN_BY_DASHBOARD } from "../lib/product-journey";
import { ROLE_ONBOARDING_PATHS } from "../lib/onboarding/role-paths";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function run() {
  // Nurse hero path
  const nurseHero = read("components/dashboard/nurse/NurseHeroDemoPath.tsx");
  assert.ok(nurseHero.includes("nurse-hero-demo-path"));
  assert.ok(nurseHero.includes("/dashboard/nurse/observations"));
  assert.ok(nurseHero.includes("/dashboard/nurse/handover"));
  assert.ok(nurseHero.includes("/dashboard/nurse/alerts"));
  assert.ok(nurseHero.includes("/demo/script"));
  assert.ok(nurseHero.includes("liveEmis:false"));
  assert.ok(nurseHero.includes("GUARDIAN"));
  assert.ok(nurseHero.includes("synthetic"));
  assert.ok(nurseHero.includes("aksh-nurse-hero-demo-dismissed") || nurseHero.includes("useDismissibleDemo"));

  const nursePage = read("app/dashboard/nurse/page.tsx");
  assert.ok(nursePage.includes("NurseHeroDemoPath"));
  assert.ok(nursePage.includes("nurse-honesty-banner"));
  assert.ok(nursePage.includes("liveEmis:false"));
  assert.ok(nursePage.includes("nurse-vitals"));

  const voiceCare = read("components/dashboard/nurse/VoiceCareEscalationCard.tsx");
  assert.ok(voiceCare.includes("voice-care-strip"));
  assert.ok(voiceCare.includes("/api/agents/voice-care"));
  assert.ok(voiceCare.includes("synthetic outbound"));

  assert.ok(read("app/dashboard/nurse/observations/page.tsx").includes("NurseHeroDemoPath"));
  assert.ok(read("app/dashboard/nurse/handover/page.tsx").includes("NurseHeroDemoPath"));
  assert.ok(read("app/dashboard/nurse/alerts/page.tsx").includes("NurseHeroDemoPath"));

  // Pharmacist hero path
  const pharmHero = read("components/dashboard/pharmacist/PharmacistHeroDemoPath.tsx");
  assert.ok(pharmHero.includes("pharmacist-hero-demo-path"));
  assert.ok(pharmHero.includes("/dashboard/pharmacist/reviews"));
  assert.ok(pharmHero.includes("/dashboard/pharmacist/interactions"));
  assert.ok(pharmHero.includes("pharmacist-hitl-stage"));
  assert.ok(pharmHero.includes("/demo/script"));
  assert.ok(pharmHero.includes("liveEmis:false"));
  assert.ok(pharmHero.includes("GUARDIAN"));
  assert.ok(pharmHero.includes("SHIELD"));

  const pharmPage = read("app/dashboard/pharmacist/page.tsx");
  assert.ok(pharmPage.includes("PharmacistHeroDemoPath"));
  assert.ok(pharmPage.includes("pharmacist-honesty-banner"));
  assert.ok(pharmPage.includes("pharmacist-review"));
  assert.ok(pharmPage.includes("liveEmis:false"));

  assert.ok(read("app/dashboard/pharmacist/reviews/page.tsx").includes("PharmacistHeroDemoPath"));
  assert.ok(read("app/dashboard/pharmacist/interactions/page.tsx").includes("PharmacistHeroDemoPath"));

  const interactions = read("components/dashboard/pharmacist/InteractionChecker.tsx");
  assert.ok(interactions.includes("pharmacist-hitl-stage"));
  assert.ok(interactions.includes("liveEmis:false"));
  assert.ok(interactions.includes("SHIELD"));

  const medQueue = read("components/dashboard/pharmacist/MedReviewQueue.tsx");
  assert.ok(medQueue.includes("/api/clinical-spine/pharmacist-review"));
  assert.ok(medQueue.includes("liveEmis:false"));

  const vitals = read("components/dashboard/nurse/VitalsForm.tsx");
  assert.ok(vitals.includes("/api/clinical-spine/nurse-vitals"));

  // First-run aligned with U1–U3 / 3-beat + med-safety
  const nurseFirst = FIRST_RUN_BY_DASHBOARD.nurse;
  assert.equal(nurseFirst.primaryHref, "/dashboard/nurse/observations");
  assert.equal(nurseFirst.secondaryHref, "/demo/script");
  assert.ok(nurseFirst.agents?.includes("CANVAS"));
  assert.ok(nurseFirst.agents?.includes("GUARDIAN"));
  assert.ok(nurseFirst.agents?.includes("SHIELD"));
  assert.match(nurseFirst.body, /3-beat|Observations|GUARDIAN/i);
  assert.match(nurseFirst.honesty ?? "", /liveEmis:false/);

  const pharmFirst = FIRST_RUN_BY_DASHBOARD.pharmacist;
  assert.equal(pharmFirst.primaryHref, "/dashboard/pharmacist/reviews");
  assert.equal(pharmFirst.secondaryHref, "/demo/script");
  assert.ok(pharmFirst.agents?.includes("GUARDIAN"));
  assert.ok(pharmFirst.agents?.includes("SHIELD"));
  assert.ok(pharmFirst.agents?.includes("BRIDGE"));
  assert.match(pharmFirst.body, /GUARDIAN|Accept|SHIELD/i);
  assert.match(pharmFirst.honesty ?? "", /liveEmis:false/);

  // Onboarding tutorials still name the demo beats
  assert.match(ROLE_ONBOARDING_PATHS.nurse.pathPromise, /Observations|handover|GUARDIAN/i);
  assert.match(ROLE_ONBOARDING_PATHS["clinical-pharmacist"].pathPromise, /Med review|GUARDIAN|HITL/i);

  // Demo script panels
  const demoScript = read("components/demo/DemoLaunchScript.tsx");
  assert.ok(demoScript.includes("nurse-hero-script-panel"));
  assert.ok(demoScript.includes("pharmacist-hero-script-panel"));
  assert.ok(demoScript.includes("/dashboard/nurse"));
  assert.ok(demoScript.includes("/dashboard/pharmacist"));
  assert.ok(demoScript.includes("liveEmis: false") || demoScript.includes("liveEmis:false"));
  assert.ok(demoScript.includes("nurse-vitals") || demoScript.includes("GUARDIAN"));
  assert.ok(!demoScript.includes("14 agents"));

  // Smoke scripts still exist for exit criteria
  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-nurse-dashboard.mjs")));
  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-pharmacist-dashboard.mjs")));
  const nurseSmoke = read("scripts/smoke-nurse-dashboard.mjs");
  const pharmSmoke = read("scripts/smoke-pharmacist-dashboard.mjs");
  assert.ok(nurseSmoke.includes("Voice Care"));
  assert.ok(pharmSmoke.includes("Med-safety demo"));

  // No live EMIS flip
  assert.ok(!nurseHero.includes("liveEmis:true"));
  assert.ok(!pharmHero.includes("liveEmis:true"));
  assert.ok(!nursePage.includes("connected to the GP record"));
  assert.ok(!pharmPage.includes("connected to the GP record"));

  console.log("U5 nurse + pharmacist dashboard demo polish checks passed.");
}

void run();
