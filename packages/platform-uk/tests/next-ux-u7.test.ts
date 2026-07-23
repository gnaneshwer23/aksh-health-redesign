/**
 * U7 — ICS + hospital dashboard demo polish.
 * ICS: population → COMPASS equity → forecast; aggregate / synthetic; no patient-level spill.
 * Hospital: wards → capacity → staffing; synthetic PAS; PATHWAY / HORIZON framing.
 * First-run + demo script aligned; honesty: liveEmis:false · not live PAS / ICS feed.
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
  const icsHero = read("components/dashboard/ics/IcsHeroDemoPath.tsx");
  assert.ok(icsHero.includes("ics-hero-demo-path"));
  assert.ok(icsHero.includes("/dashboard/ics/population"));
  assert.ok(icsHero.includes("/dashboard/ics/equity"));
  assert.ok(icsHero.includes("/dashboard/ics/forecast"));
  assert.ok(icsHero.includes("/demo/script"));
  assert.ok(icsHero.includes("liveEmis:false"));
  assert.ok(icsHero.includes("COMPASS"));
  assert.ok(icsHero.includes("aggregate") || icsHero.includes("patient-level"));
  assert.ok(icsHero.includes("synthetic"));

  const hospitalHero = read("components/dashboard/hospital/HospitalHeroDemoPath.tsx");
  assert.ok(hospitalHero.includes("hospital-hero-demo-path"));
  assert.ok(hospitalHero.includes("/dashboard/hospital/wards"));
  assert.ok(hospitalHero.includes("/dashboard/hospital/capacity"));
  assert.ok(hospitalHero.includes("/dashboard/hospital/staffing"));
  assert.ok(hospitalHero.includes("/demo/script"));
  assert.ok(hospitalHero.includes("liveEmis:false"));
  assert.ok(hospitalHero.includes("synthetic PAS"));
  assert.ok(hospitalHero.includes("PATHWAY") || hospitalHero.includes("HORIZON"));

  const icsPage = read("app/dashboard/ics/page.tsx");
  assert.ok(icsPage.includes("IcsHeroDemoPath"));
  assert.ok(icsPage.includes("ics-honesty-banner"));
  assert.ok(icsPage.includes("no patient-level spill"));
  assert.ok(icsPage.includes("liveEmis:false"));
  assert.ok(icsPage.includes("COMPASS"));
  assert.ok(!icsPage.includes("demoPatientHref"));

  assert.ok(read("app/dashboard/ics/population/page.tsx").includes("IcsHeroDemoPath"));
  assert.ok(read("app/dashboard/ics/equity/page.tsx").includes("IcsHeroDemoPath"));
  assert.ok(read("app/dashboard/ics/forecast/page.tsx").includes("IcsHeroDemoPath"));

  const hospitalPage = read("app/dashboard/hospital/page.tsx");
  assert.ok(hospitalPage.includes("HospitalHeroDemoPath"));
  assert.ok(hospitalPage.includes("hospital-honesty-banner"));
  assert.ok(hospitalPage.includes("Not live PAS"));
  assert.ok(hospitalPage.includes("liveEmis:false"));
  assert.ok(hospitalPage.includes("PATHWAY") || hospitalPage.includes("HORIZON"));

  assert.ok(read("app/dashboard/hospital/wards/page.tsx").includes("HospitalHeroDemoPath"));
  assert.ok(read("app/dashboard/hospital/capacity/page.tsx").includes("HospitalHeroDemoPath"));
  assert.ok(read("app/dashboard/hospital/staffing/page.tsx").includes("HospitalHeroDemoPath"));

  const mockBanner = read("components/dashboard/hospital/HospitalMockModeBanner.tsx");
  assert.ok(mockBanner.includes("Not live PAS"));
  assert.ok(mockBanner.includes("liveEmis:false"));

  // First-run aligned with hero beats
  const icsFirst = FIRST_RUN_BY_DASHBOARD.ics;
  assert.equal(icsFirst.primaryHref, "/dashboard/ics/population");
  assert.equal(icsFirst.secondaryHref, "/demo/script");
  assert.ok(icsFirst.agents?.includes("COMPASS"));
  assert.match(icsFirst.body, /COMPASS|population|equity|forecast/i);
  assert.match(icsFirst.honesty ?? "", /liveEmis:false/);

  const hospitalFirst = FIRST_RUN_BY_DASHBOARD.hospital;
  assert.equal(hospitalFirst.primaryHref, "/dashboard/hospital/wards");
  assert.equal(hospitalFirst.secondaryHref, "/demo/script");
  assert.ok(hospitalFirst.agents?.includes("HORIZON") || hospitalFirst.agents?.includes("PATHWAY"));
  assert.match(hospitalFirst.body, /wards|capacity|staffing|PAS/i);
  assert.match(hospitalFirst.honesty ?? "", /liveEmis:false/);

  assert.match(ROLE_DASHBOARD_PREVIEW["ics-lead"].honesty ?? "", /liveEmis:false/);
  assert.match(ROLE_DASHBOARD_PREVIEW["ics-lead"].firstFocus, /population|COMPASS|forecast/i);
  assert.match(ROLE_DASHBOARD_PREVIEW["hospital-executive"].honesty ?? "", /PAS|liveEmis:false/);
  assert.match(ROLE_DASHBOARD_PREVIEW["hospital-executive"].firstFocus, /wards|capacity|staffing/i);

  assert.match(ROLE_ONBOARDING_PATHS["ics-lead"].pathPromise, /Population|COMPASS|forecast/i);
  assert.match(ROLE_ONBOARDING_PATHS["hospital-executive"].pathPromise, /Wards|capacity|staffing|PAS/i);

  // Demo script panels
  const demoScript = read("components/demo/DemoLaunchScript.tsx");
  assert.ok(demoScript.includes("ics-hero-script-panel"));
  assert.ok(demoScript.includes("hospital-hero-script-panel"));
  assert.ok(demoScript.includes("/dashboard/ics"));
  assert.ok(demoScript.includes("/dashboard/hospital"));
  assert.ok(demoScript.includes("liveEmis: false") || demoScript.includes("liveEmis:false"));
  assert.ok(demoScript.includes("COMPASS"));
  assert.ok(demoScript.includes("synthetic PAS") || demoScript.includes("Not live PAS"));
  assert.ok(!demoScript.includes("14 agents"));

  // Smoke scripts assert hero copy
  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-ics-dashboard.mjs")));
  const icsSmoke = read("scripts/smoke-ics-dashboard.mjs");
  assert.ok(icsSmoke.includes("Population demo"));
  assert.ok(icsSmoke.includes("liveEmis:false"));
  assert.ok(icsSmoke.includes("no patient-level spill"));

  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-hospital-dashboard.mjs")));
  const hospitalSmoke = read("scripts/smoke-hospital-dashboard.mjs");
  assert.ok(hospitalSmoke.includes("Command-centre demo"));
  assert.ok(hospitalSmoke.includes("liveEmis:false"));
  assert.ok(hospitalSmoke.includes("Not live PAS"));

  assert.ok(!icsHero.includes("liveEmis:true"));
  assert.ok(!hospitalHero.includes("liveEmis:true"));
  assert.ok(!icsPage.includes("liveEmis:true"));
  assert.ok(!hospitalPage.includes("liveEmis:true"));

  console.log("U7 ICS + hospital dashboard demo polish checks passed.");
}

void run();
