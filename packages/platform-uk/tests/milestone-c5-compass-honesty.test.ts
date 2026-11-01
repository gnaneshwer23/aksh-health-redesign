/**
 * Milestone C5 — COMPASS / alias / directory honesty.
 * Synthetic / controlled data only. Does not claim clinical validation or certified ICS routing.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  ALIAS_HONESTY_LINES,
  PRODUCT_ALIAS_MAP,
  VOICE_ALIAS_HONESTY,
  listAliasHonestyRows,
  productFacingAliasLabel,
} from "../lib/agents/alias-honesty";
import {
  COMPASS_CAPABILITIES,
  COMPASS_HONESTY_LINES,
  COMPASS_NON_CLAIMS,
  buildCompassHonestyModel,
} from "../lib/agents/compass-honesty";
import {
  assertDirectoryRegisterAligned,
  buildDirectoryRegisterAlignment,
  directoryPathKindSummary,
} from "../lib/agents/directory-honesty";
import { VOICE_CARE_PRODUCT_LABEL } from "../lib/voice-care";

const root = path.join(__dirname, "..");

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const doc = read("docs/milestone-c/COMPASS_HONESTY.md");
  assert.match(doc, /What C5 is/);
  assert.match(doc, /What C5 is not/);
  assert.match(doc, /decision-support/i);
  assert.match(doc, /certified ICS routing/i);
  assert.match(doc, /VOICE CARE/);
  assert.match(doc, /live-path|scaffold|sim/);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /test:milestone-c:compass-honesty/);
  assert.match(doc, /clinical validation/i);
  assert.match(doc, /Not.*COMPASS product expansion/i);

  const c1 = read("docs/milestone-c/FACILITATOR_SESSION.md");
  assert.match(c1, /COMPASS_HONESTY/);
  assert.match(c1, /Week 2/);
  assert.match(c1, /VOICE CARE/);

  const plan = read("docs/agents/HCP_AGENT_EVALUATION_PLAN.md");
  assert.match(plan, /Milestone C5/);
  assert.match(plan, /COMPASS_HONESTY/);

  // --- COMPASS helpers ---
  const model = buildCompassHonestyModel();
  assert.equal(model.clinicalValidationClaim, false);
  assert.equal(model.certifiedIcsRouting, false);
  assert.equal(model.ehrWrite, false);
  assert.equal(COMPASS_CAPABILITIES.decisionSupportOnly, true);
  assert.equal(COMPASS_CAPABILITIES.sandbox, true);
  assert.equal(COMPASS_CAPABILITIES.productLabel, "COMPASS");
  assert.equal(COMPASS_CAPABILITIES.legacyAlias, "EQUITY");
  assert.ok(COMPASS_HONESTY_LINES.length >= 4);
  assert.ok(COMPASS_NON_CLAIMS.some((n) => /certified ICS/i.test(n)));

  // --- Alias helpers ---
  assert.equal(productFacingAliasLabel("ORACLE"), "HORIZON");
  assert.equal(productFacingAliasLabel("EQUITY"), "COMPASS");
  assert.equal(productFacingAliasLabel("REFERRAL"), "PATHWAY");
  assert.equal(productFacingAliasLabel("VOICE_CARE"), "VOICE CARE");
  assert.ok(VOICE_ALIAS_HONESTY.voice.not.includes("VOICE CARE"));
  assert.ok(VOICE_ALIAS_HONESTY.voiceCare.not.includes("VOICE"));
  assert.equal(VOICE_ALIAS_HONESTY.voiceCare.telephony, false);
  assert.ok(VOICE_CARE_PRODUCT_LABEL.includes("not VOICE dictation"));
  assert.equal(PRODUCT_ALIAS_MAP.length, 3);
  assert.ok(ALIAS_HONESTY_LINES.some((l) => /VOICE CARE/.test(l)));
  const aliasRows = listAliasHonestyRows();
  assert.ok(aliasRows.some((r) => r.productLabel === "VOICE CARE" && r.kind === "adjacent_sim"));
  assert.ok(aliasRows.some((r) => r.productLabel === "HORIZON" && r.legacyOrAdjacent === "ORACLE"));

  // --- Directory ↔ register ---
  const aligned = assertDirectoryRegisterAligned();
  assert.equal(aligned.ok, true, aligned.ok ? "" : aligned.failures.join("; "));
  const rows = buildDirectoryRegisterAlignment();
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
  assert.equal(byId.PRISM.pathKind, "scaffold");
  assert.equal(byId.ATLAS.pathKind, "scaffold");
  assert.equal(byId.COMPASS.pathKind, "sim");
  assert.equal(byId.SYNTHESIS.pathKind, "live_path");
  assert.equal(byId.VOICE.inDirectory, false);
  assert.equal(byId.VOICE_CARE.pathKind, "sim");
  assert.ok(
    !rows.some(
      (r) => /\bproduction\s+ready\b/i.test(r.honestyLabel) && !/\bnot\s+production\s+ready\b/i.test(r.honestyLabel)
    )
  );
  assert.ok(!rows.some((r) => r.registerStatus === "production"));
  const summary = directoryPathKindSummary();
  assert.ok(summary.scaffold >= 2);
  assert.ok(summary.sim >= 1);
  assert.ok(summary.live_path >= 1);

  // --- Surfaces ---
  const compassPanel = read("components/dashboard/admin/CompassBriefPanel.tsx");
  assert.match(compassPanel, /CompassHonestyStrip/);
  assert.match(compassPanel, /decision-support|sandbox/i);
  assert.match(compassPanel, /certified ICS routing/i);

  const strip = read("components/dashboard/admin/CompassHonestyStrip.tsx");
  assert.match(strip, /data-testid="compass-honesty-strip"/);
  assert.match(strip, /data-certified-ics-routing="false"/);
  assert.match(strip, /data-clinical-validation-claim="false"/);

  const ops = read("app/dashboard/admin/agent-ops/page.tsx");
  assert.match(ops, /AliasHonestyPanel/);
  assert.match(ops, /DirectoryHonestyPanel/);
  assert.match(ops, /CompassBriefPanel/);
  assert.match(ops, /not production ready/i);
  assert.doesNotMatch(ops, /productionRbacEnforced\s*[:=]\s*true/);

  const aliasPanel = read("components/dashboard/admin/AliasHonestyPanel.tsx");
  assert.match(aliasPanel, /data-testid="alias-honesty-panel"/);
  assert.match(aliasPanel, /VOICE CARE/);

  const dirPanel = read("components/dashboard/admin/DirectoryHonestyPanel.tsx");
  assert.match(dirPanel, /data-testid="directory-honesty-panel"/);
  assert.match(dirPanel, /data-path-kind/);
  assert.match(dirPanel, /production ready/i);

  const equityDeep = read("components/dashboard/ics/EquityDeepDive.tsx");
  assert.match(equityDeep, /CompassHonestyStrip/);
  assert.match(equityDeep, /decision-support/i);
  assert.doesNotMatch(equityDeep, /most-built Population Intelligence/);

  const icsEquity = read("app/dashboard/ics/equity/page.tsx");
  assert.match(icsEquity, /data-testid="ics-equity-honesty"/);
  assert.match(icsEquity, /not certified ICS routing/);

  const equityRoute = read("app/api/agents/equity/route.ts");
  assert.match(equityRoute, /COMPASS_CAPABILITIES|buildCompassHonestyModel/);
  assert.match(equityRoute, /certifiedIcsRouting:\s*false/);
  assert.match(equityRoute, /clinicalValidationClaim:\s*false/);

  const voiceCare = read("components/dashboard/nurse/VoiceCareEscalationCard.tsx");
  assert.match(voiceCare, /data-testid="voice-care-not-voice"/);
  assert.match(voiceCare, /≠ VOICE dictation/);
  assert.match(voiceCare, /VOICE CARE/);

  const voiceMic = read("components/gp/voice-mic-panel.tsx");
  assert.match(voiceMic, /data-testid="voice-not-voice-care"/);
  assert.match(voiceMic, /≠ VOICE CARE/);

  // Do not flip production RBAC in C5 surfaces
  assert.doesNotMatch(strip, /productionRbacEnforced\s*[:=]\s*true/);
  assert.doesNotMatch(compassPanel, /productionRbacEnforced\s*[:=]\s*true/);

  const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
  assert.ok(pkg.scripts["test:milestone-c:compass-honesty"]);
  assert.match(pkg.scripts["test:milestone-c"], /test:milestone-c:compass-honesty/);

  console.log("milestone-c5-compass-honesty: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
