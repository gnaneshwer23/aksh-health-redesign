/**
 * Phase B clinical spine — consent-gated role ingest + biomarker-lite timeline.
 * Honest invariants: ehrWrite:false · autoRetrain:false · liveEmis:false · no invented live streams.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";

import {
  extractBiomarkerLite,
  formatBiomarkerLite
} from "../lib/precision-health/biomarkers";
import {
  ROLE_INGEST_CONNECTOR_IDS,
  buildLifestyleDiarySample,
  buildSyntheticWearableSample,
  listConnectorStatuses
} from "../lib/precision-health/connectors";
import { isModalityGranted } from "../lib/precision-health/consent";
import { runIngestionPipeline } from "../lib/precision-health/ingestion-pipeline";
import { buildPatientTimeline } from "../lib/precision-health/timeline";
import { upsertConsentGrant } from "../lib/repositories/consent-grant-repository";

const scopeKey = `phase_b_${Date.now()}`;
const dataDir = path.join(process.cwd(), "data");

async function run() {
  // --- Connector honesty ---
  const statuses = listConnectorStatuses();
  const fitbit = statuses.find((c) => c.id === "fitbit_oauth_stub");
  assert.ok(fitbit);
  if (!process.env.FITBIT_CLIENT_ID?.trim() || !process.env.FITBIT_CLIENT_SECRET?.trim()) {
    assert.equal(fitbit.liveStream, false);
  }
  assert.deepEqual(
    [...ROLE_INGEST_CONNECTOR_IDS].sort(),
    ["file_import", "lifestyle_diary", "wearable_synthetic_stream"].sort()
  );

  // --- Biomarker-lite from samples ---
  const wearable = buildSyntheticWearableSample("P001");
  const lifestyle = buildLifestyleDiarySample("P001");
  const wb = extractBiomarkerLite(wearable);
  const lb = extractBiomarkerLite(lifestyle);
  assert.ok(wb?.heartRateBpm != null);
  assert.ok(wb?.steps != null);
  assert.ok(lb?.sleepHours != null);
  const chips = formatBiomarkerLite({ ...wb, ...lb });
  assert.ok(chips.some((c) => c.startsWith("HR ")));
  assert.ok(chips.some((c) => c.startsWith("Steps ")));
  assert.ok(chips.some((c) => c.startsWith("Sleep ")));

  // --- Consent gate before ingest ---
  const refused = await runIngestionPipeline(
    {
      connectorId: "wearable_synthetic_stream",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "phase-b-test" }
  );
  assert.equal(refused.accepted, false);
  assert.equal(refused.liveStream, false);
  assert.equal(refused.ehrWrite, false);

  const { grant } = await upsertConsentGrant(
    {
      patientId: "P001",
      purposeCode: "care_delivery",
      modalities: ["wearable", "lifestyle"],
      grantedBy: "phase-b-test@aksh.health"
    },
    { scopeKey, actor: "phase-b-test@aksh.health" }
  );
  assert.equal(grant.status, "active");
  assert.ok(isModalityGranted([grant], "P001", "wearable", "care_delivery"));

  const accepted = await runIngestionPipeline(
    {
      connectorId: "wearable_synthetic_stream",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "phase-b-test" }
  );
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.liveStream, false);
  assert.equal(accepted.ehrWrite, false);
  assert.equal(accepted.shieldLogged, true);
  assert.ok(accepted.sample);

  const fileImport = await runIngestionPipeline(
    {
      connectorId: "file_import",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "phase-b-test" }
  );
  assert.equal(fileImport.accepted, true);
  assert.equal(fileImport.liveStream, false);

  const lifestyleIngest = await runIngestionPipeline(
    {
      connectorId: "lifestyle_diary",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "phase-b-test" }
  );
  assert.equal(lifestyleIngest.accepted, true);

  // --- Timeline surfaces biomarker-lite ---
  const timeline = buildPatientTimeline({
    patientId: "P001",
    modalitySamples: [accepted.sample!, lifestyleIngest.sample!].filter(Boolean),
    consentGrants: [grant],
    learningEvents: []
  });
  const modalityEvents = timeline.events.filter((e) => e.kind === "modality_sample");
  assert.ok(modalityEvents.length >= 2);
  const withBiomarkers = modalityEvents.filter(
    (e) => e.metadata?.biomarkers && typeof e.metadata.biomarkers === "object"
  );
  assert.ok(withBiomarkers.length >= 1);
  assert.ok(
    withBiomarkers.some((e) => {
      const b = e.metadata?.biomarkers as { heartRateBpm?: number };
      return b.heartRateBpm != null;
    })
  );
  assert.ok(modalityEvents.some((e) => /HR \d+ bpm/.test(e.summary) || /Sleep /.test(e.summary)));

  // --- UI wiring (static contracts) ---
  const gpPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/gp/patients/[id]/page.tsx"),
    "utf8"
  );
  assert.ok(gpPage.includes("ConnectorsIngestPanel"));
  assert.ok(gpPage.includes('mode="clinician"'));
  assert.ok(gpPage.includes("timelineRefreshKey"));

  const companion = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/PatientCompanion.tsx"),
    "utf8"
  );
  assert.ok(companion.includes("ConnectorsIngestPanel"));
  assert.ok(companion.includes('mode="patient"'));

  const ingestUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/ConnectorsIngestPanel.tsx"),
    "utf8"
  );
  assert.ok(ingestUi.includes("Fitbit stub disabled"));
  assert.ok(ingestUi.includes("ROLE_INGEST_CONNECTOR_IDS"));
  assert.ok(ingestUi.includes("Consent required before ingest"));
  assert.ok(ingestUi.includes("file_import"));

  const timelineUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/PatientTimelinePanel.tsx"),
    "utf8"
  );
  assert.ok(timelineUi.includes("timeline-biomarker-lite"));
  assert.ok(timelineUi.includes("refreshKey"));

  const spine = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spine.includes("spine-phase-b-ingest"));
  assert.ok(spine.includes("/api/precision-health/connectors"));

  const nurse = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/nurse/VitalsForm.tsx"),
    "utf8"
  );
  assert.ok(nurse.includes("nurse-vitals-timeline-note"));
  assert.ok(nurse.includes("patient timeline"));

  const checklist = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_B.md"),
    "utf8"
  );
  assert.ok(checklist.includes("liveEmis: false"));
  assert.ok(checklist.includes("autoRetrain: false"));

  for (const name of [`consent-grants.${scopeKey}.json`, `modality-samples.${scopeKey}.json`]) {
    try {
      await unlink(path.join(dataDir, name));
    } catch {
      /* ignore */
    }
  }

  console.log("Phase B clinical spine checks passed.");
}

void run();
