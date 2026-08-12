/**
 * P2 — Role polish + population/ops variants.
 * Admin ops metrics; honesty consolidation; dismissible heroes; aggregate Ask stubs;
 * hospital ward drill-in with ops Ask denied; quiet VoiceCare; Neo4j folded into HonestyStatusBar.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel: string) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function run() {
  const adminPage = read("app/dashboard/admin/page.tsx");
  assert.ok(adminPage.includes("admin-ops-metrics"));
  assert.ok(adminPage.includes("Care pathways pending"));
  assert.ok(adminPage.includes("Organisation enquiries"));
  assert.ok(adminPage.includes("EHR write-back"));
  assert.ok(!adminPage.includes("Certifications"));
  assert.ok(!adminPage.includes("Auto-writes"));
  assert.ok(adminPage.includes('className="sr-only"') || adminPage.includes("sr-only"));

  const honesty = read("components/dashboard/HonestyStatusBar.tsx");
  assert.ok(honesty.includes("Not live PAS"));
  assert.ok(honesty.includes("aggregate planning") || honesty.includes("ICS"));

  const aggregate = read("components/dashboard/AggregateAskStub.tsx");
  assert.ok(aggregate.includes("aggregate-ask-stub"));
  assert.ok(aggregate.includes('role: "ics" | "researcher"'));
  assert.ok(aggregate.includes("Named patient chat is not available"));
  assert.ok(aggregate.includes("Ask (not available yet)"));
  assert.ok(aggregate.includes("disabled"));
  assert.ok(!aggregate.includes("fetch("));

  const wardCtx = read("components/dashboard/hospital/WardPatientContext.tsx");
  assert.ok(wardCtx.includes("ops-ask-aksh-denied"));
  assert.ok(wardCtx.includes("operations_lead"));
  assert.ok(wardCtx.includes("hospital-ask-aksh-disabled"));

  const hospitalPage = read("app/dashboard/hospital/page.tsx");
  assert.ok(hospitalPage.includes("WardPatientContext"));
  assert.ok(hospitalPage.includes("HospitalCommandMap"));
  assert.ok(!hospitalPage.includes("SpineSharedEventsPanel"));

  const hospitalLayout = read("app/dashboard/hospital/layout.tsx");
  assert.ok(!hospitalLayout.includes("HospitalMockModeBanner"));
  assert.ok(hospitalLayout.includes('surface: "Hospital"'));

  const nurseLayout = read("app/dashboard/nurse/layout.tsx");
  assert.ok(nurseLayout.includes("neo4jSource"));
  assert.ok(nurseLayout.includes("showNeo4jLive"));

  const pharmLayout = read("app/dashboard/pharmacist/layout.tsx");
  assert.ok(pharmLayout.includes("neo4jSource"));
  assert.ok(pharmLayout.includes("showNeo4jLive"));

  const guardian = read("components/dashboard/nurse/GuardianAlertsPanel.tsx");
  assert.ok(!guardian.includes("Neo4jMockModeBanner"));

  const medQueue = read("components/dashboard/pharmacist/MedReviewQueue.tsx");
  assert.ok(!medQueue.includes("Neo4jMockModeBanner"));

  const voice = read("components/dashboard/nurse/VoiceCareEscalationCard.tsx");
  assert.ok(voice.includes("voice-care-strip"));
  assert.ok(voice.includes("expanded"));

  for (const hero of [
    "components/dashboard/admin/AdminHeroDemoPath.tsx",
    "components/dashboard/nurse/NurseHeroDemoPath.tsx",
    "components/dashboard/ics/IcsHeroDemoPath.tsx",
    "components/dashboard/hospital/HospitalHeroDemoPath.tsx",
    "components/dashboard/researcher/ResearcherHeroDemoPath.tsx",
  ]) {
    const src = read(hero);
    assert.ok(src.includes("useDismissibleDemo"), `${hero} should use dismissible demo hook`);
    assert.ok(src.includes("Dismiss demo path"), `${hero} should expose dismiss control`);
  }

  const demoMenu = read("components/dashboard/DemoMenu.tsx");
  assert.ok(demoMenu.includes("admin:"));
  assert.ok(demoMenu.includes("ics:"));
  assert.ok(demoMenu.includes("hospital:"));
  assert.ok(demoMenu.includes("researcher:"));

  // Non-NHS / general care-coordination voice on touched surfaces
  assert.ok(!adminPage.toLowerCase().includes("nhs england"));
  assert.ok(!read("app/dashboard/ics/page.tsx").toLowerCase().includes("nhs england"));
  assert.ok(!hospitalPage.toLowerCase().includes("nhs product"));

  console.log("P2 role polish + population/ops variant checks passed.");
}

void run();
