/**
 * Phase F clinical spine — partner / regulatory readiness track.
 * Invariants: liveEmis:false · autoRetrain:false · physiologicalTwin:false ·
 * gate artefacts never certified · never unlock liveEmis.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";

import {
  SPINE_PARTNER_HONESTY,
  buildPartnerReadinessPack,
  canFlipLiveEmisInCode,
  getEvidencePackLinks,
  getLiveEmisFlipChecklist
} from "../lib/clinical-spine/partner-readiness";
import {
  EMIS_NOT_LIVE_BANNER,
  getEmisIntegrationStatus,
  queueEmisFhirStaging
} from "../lib/emis-staging";
import { getEmisPartnerChecklist } from "../lib/precision-health/emis-partner-checklist";
import {
  listPartnerGateArtifacts,
  recordPartnerGateArtifact
} from "../lib/repositories/partner-gate-artifact-repository";

const scopeKey = `phase_f_${Date.now()}`;
const dataDir = path.join(process.cwd(), "data");

async function run() {
  // --- Honesty flags ---
  assert.equal(SPINE_PARTNER_HONESTY.liveEmis, false);
  assert.equal(SPINE_PARTNER_HONESTY.liveWriteBack, false);
  assert.equal(SPINE_PARTNER_HONESTY.autoRetrain, false);
  assert.equal(SPINE_PARTNER_HONESTY.physiologicalTwin, false);
  assert.equal(SPINE_PARTNER_HONESTY.hitlRequired, true);
  assert.equal(SPINE_PARTNER_HONESTY.ehrWrite, false);
  assert.equal(SPINE_PARTNER_HONESTY.signedDpia, false);
  assert.equal(SPINE_PARTNER_HONESTY.signedCsoGate2, false);
  assert.equal(SPINE_PARTNER_HONESTY.signedDcb0129, false);
  assert.equal(SPINE_PARTNER_HONESTY.signedMhra, false);
  assert.equal(canFlipLiveEmisInCode(), false);

  // --- EMIS staging not-live ---
  const staging = getEmisIntegrationStatus();
  assert.equal(staging.liveEmis, false);
  assert.equal(staging.enabled, false);
  assert.equal(staging.liveWriteBack, false);
  assert.ok(staging.notLiveBanner.includes("NOT LIVE EMIS"));
  assert.equal(EMIS_NOT_LIVE_BANNER.includes("liveEmis:false"), true);

  const queued = queueEmisFhirStaging({
    approvedBy: "phase-f@aksh.health",
    caseId: "case-phase-f",
    bundleSummary: "Phase F sim bundle"
  });
  assert.equal(queued.liveEmis, false);
  assert.equal(queued.ehrWriteAttempted, false);
  assert.ok(queued.note.includes("NOT LIVE EMIS") || queued.note.includes("no EMIS network"));

  const checklist = getEmisPartnerChecklist();
  assert.equal(checklist.liveEmis, false);
  assert.ok(checklist.liveEmisFlipRequirements.length >= 5);
  assert.ok(checklist.liveEmisFlipRequirements.some((i) => i.id === "flip-go-nogo"));
  assert.equal(
    checklist.liveEmisFlipRequirements.find((i) => i.id === "flip-go-nogo")?.status,
    "blocked"
  );
  assert.ok(checklist.notLiveBanner.includes("NOT LIVE"));

  // --- Gate artefacts: pending only, never certified ---
  const noted = await recordPartnerGateArtifact(
    {
      gateId: "DPIA_EMR",
      status: "external_ref_noted",
      externalRef: "DPIA-DRAFT-phase-f",
      note: "Draft DPIA with IG — not signed",
      actor: "phase-f-admin@aksh.health"
    },
    { scopeKey }
  );
  assert.equal(noted.certified, false);
  assert.equal(noted.unlocksLiveEmis, false);
  assert.equal(noted.status, "external_ref_noted");

  const pending = await recordPartnerGateArtifact(
    {
      gateId: "CSO_GATE2",
      status: "pending_review",
      note: "Awaiting named CSO",
      actor: "phase-f-admin@aksh.health"
    },
    { scopeKey }
  );
  assert.equal(pending.certified, false);

  const listed = await listPartnerGateArtifacts({ scopeKey, limit: 20 });
  assert.ok(listed.records.length >= 2);
  assert.ok(listed.records.every((r) => r.certified === false));
  assert.ok(listed.records.every((r) => r.unlocksLiveEmis === false));

  // --- Readiness pack ---
  const pack = buildPartnerReadinessPack({ artifacts: listed.records });
  assert.equal(pack.honesty.liveEmis, false);
  assert.equal(pack.gateArtifacts.anyCertified, false);
  assert.ok(pack.tracks.some((t) => t.id === "emis_systmone"));
  assert.ok(pack.tracks.some((t) => t.id === "dpia"));
  assert.ok(pack.tracks.some((t) => t.id === "cso_gate2"));
  assert.ok(pack.tracks.some((t) => t.id === "g_ml_gates"));
  const dpiaTrack = pack.tracks.find((t) => t.id === "dpia");
  assert.ok(dpiaTrack);
  assert.equal(dpiaTrack.uiStatus, "pending");
  assert.ok(pack.notLiveBanner.includes("NOT LIVE EMIS"));
  assert.ok(getLiveEmisFlipChecklist().some((i) => i.status === "blocked"));
  assert.ok(getEvidencePackLinks().some((l) => l.id === "gate-2"));
  assert.ok(getEvidencePackLinks().some((l) => l.path.includes("CLINICAL_SPINE_PHASE_F")));

  // --- Routes / UI / docs ---
  const readinessRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/partner-readiness/route.ts"),
    "utf8"
  );
  assert.ok(readinessRoute.includes("buildPartnerReadinessPack"));
  assert.ok(readinessRoute.includes("liveEmis: false"));

  const gatesRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/partner-gates/route.ts"),
    "utf8"
  );
  assert.ok(gatesRoute.includes("certified === true"));
  assert.ok(gatesRoute.includes("unlocksLiveEmis"));
  assert.ok(gatesRoute.includes("recordPartnerGateArtifact"));

  const evidenceRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/evidence-pack-export/route.ts"),
    "utf8"
  );
  assert.ok(evidenceRoute.includes("getEvidencePackLinks"));
  assert.ok(evidenceRoute.includes("signedApprovalsInvented"));

  const panel = fs.readFileSync(
    path.join(
      process.cwd(),
      "components/dashboard/precision-health/PartnerReadinessPanel.tsx"
    ),
    "utf8"
  );
  assert.ok(panel.includes("partner-readiness-panel"));
  assert.ok(panel.includes("partner-not-live-banner"));
  assert.ok(panel.includes("/api/clinical-spine/partner-gates"));
  assert.ok(panel.includes("certified:false") || panel.includes("Not certified"));

  const spine = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spine.includes("spine-phase-f-partners"));
  assert.ok(spine.includes("/api/clinical-spine/partner-readiness"));

  const adminPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/admin/precision-health/page.tsx"),
    "utf8"
  );
  assert.ok(adminPage.includes("PartnerReadinessPanel"));

  const emisStagingRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/integrations/emis-staging/route.ts"),
    "utf8"
  );
  assert.ok(emisStagingRoute.includes("NOT LIVE EMIS") || emisStagingRoute.includes("notLiveBanner"));
  assert.ok(emisStagingRoute.includes("liveEmis: false"));

  const phaseFDoc = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_F.md"),
    "utf8"
  );
  assert.ok(phaseFDoc.includes("liveEmis: false"));
  assert.ok(phaseFDoc.includes("autoRetrain: false"));
  assert.ok(phaseFDoc.includes("physiologicalTwin: false"));
  assert.ok(phaseFDoc.includes("partner actions"));
  assert.ok(phaseFDoc.includes("A–F") || phaseFDoc.includes("A-F") || phaseFDoc.includes("A–F are complete"));

  const roadmap = fs.readFileSync(
    path.join(process.cwd(), "docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md"),
    "utf8"
  );
  assert.ok(roadmap.includes("CLINICAL_SPINE_PHASE_F") || roadmap.includes("Phase F"));

  // cleanup
  const file = path.join(dataDir, `partner-gate-artifacts.${scopeKey}.json`);
  if (fs.existsSync(file)) await unlink(file).catch(() => undefined);

  console.log(
    `Phase F clinical spine checks passed (gates=${listed.records.length}; staging=${queued.id}; flipBlocked=true).`
  );
}

void run();
