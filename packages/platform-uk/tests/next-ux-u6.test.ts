/**
 * U6 — Practice admin dashboard demo polish.
 * Ops hero: integrations honesty → SHIELD → users/enquiries; BRIDGE/CONDUCTOR framing;
 * first-run + demo script aligned; honesty: liveEmis:false · designed for EMIS/SystmOne ·
 * Precision Health scaffolding (no live write-back).
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
  const adminHero = read("components/dashboard/admin/AdminHeroDemoPath.tsx");
  assert.ok(adminHero.includes("admin-hero-demo-path"));
  assert.ok(adminHero.includes("/dashboard/admin/integrations"));
  assert.ok(adminHero.includes("/dashboard/admin/audit"));
  assert.ok(adminHero.includes("/dashboard/admin/organisation-enquiries"));
  assert.ok(adminHero.includes("/demo/script"));
  assert.ok(adminHero.includes("liveEmis:false"));
  assert.ok(adminHero.includes("BRIDGE") || adminHero.includes("CONDUCTOR"));
  assert.ok(adminHero.includes("SHIELD"));
  assert.ok(/EMIS|SystmOne/.test(adminHero));
  assert.ok(adminHero.includes("scaffolding") || adminHero.includes("Precision Health"));
  assert.ok(adminHero.includes("aksh-admin-hero-demo-dismissed") || adminHero.includes("useDismissibleDemo"));

  const adminPage = read("app/dashboard/admin/page.tsx");
  assert.ok(adminPage.includes("AdminHeroDemoPath"));
  assert.ok(adminPage.includes("admin-honesty-banner"));
  assert.ok(adminPage.includes("Not live EHR"));
  assert.ok(adminPage.includes("liveEmis:false"));
  assert.ok(adminPage.includes("admin-precision-health-scaffolding-link"));
  assert.ok(adminPage.includes("admin-ops-metrics"));
  assert.ok(!adminPage.includes("Certifications"));
  assert.ok(!adminPage.includes("connected to the GP record"));

  assert.ok(read("app/dashboard/admin/integrations/page.tsx").includes("AdminHeroDemoPath"));
  assert.ok(read("app/dashboard/admin/audit/page.tsx").includes("AdminHeroDemoPath"));
  assert.ok(read("app/dashboard/admin/organisation-enquiries/page.tsx").includes("AdminHeroDemoPath"));

  const quickLinks = read("components/dashboard/AdminQuickLinks.tsx");
  assert.ok(quickLinks.includes("Practice ops"));
  assert.ok(quickLinks.includes("liveEmis:false") || quickLinks.includes("scaffolding"));

  // First-run aligned with U3 / ops hero
  const adminFirst = FIRST_RUN_BY_DASHBOARD.admin;
  assert.equal(adminFirst.primaryHref, "/dashboard/admin/integrations");
  assert.equal(adminFirst.secondaryHref, "/demo/script");
  assert.ok(adminFirst.agents?.includes("CONDUCTOR"));
  assert.ok(adminFirst.agents?.includes("BRIDGE"));
  assert.ok(adminFirst.agents?.includes("SHIELD"));
  assert.match(adminFirst.body, /integrations|SHIELD|BRIDGE|CONDUCTOR/i);
  assert.match(adminFirst.honesty ?? "", /liveEmis:false/);

  const preview = ROLE_DASHBOARD_PREVIEW["practice-manager"];
  assert.match(preview.honesty ?? "", /liveEmis:false/);
  assert.match(preview.firstFocus, /ops|integrations|SHIELD/i);

  assert.match(ROLE_ONBOARDING_PATHS["practice-manager"].pathPromise, /Integrations|SHIELD|enquiries/i);

  // Demo script panel
  const demoScript = read("components/demo/DemoLaunchScript.tsx");
  assert.ok(demoScript.includes("admin-hero-script-panel"));
  assert.ok(demoScript.includes("/dashboard/admin"));
  assert.ok(demoScript.includes("liveEmis: false") || demoScript.includes("liveEmis:false"));
  assert.ok(demoScript.includes("Practice admin"));
  assert.ok(!demoScript.includes("14 agents"));

  // Smoke script asserts hero copy
  assert.ok(fs.existsSync(path.join(root, "scripts/smoke-admin-dashboard.mjs")));
  const adminSmoke = read("scripts/smoke-admin-dashboard.mjs");
  assert.ok(adminSmoke.includes("Practice operations overview"));
  assert.ok(adminSmoke.includes("liveEmis:false"));
  assert.ok(adminSmoke.includes("Not live EHR"));

  assert.ok(!adminHero.includes("liveEmis:true"));
  assert.ok(!adminPage.includes("liveEmis:true"));

  console.log("U6 practice admin dashboard demo polish checks passed.");
}

void run();
