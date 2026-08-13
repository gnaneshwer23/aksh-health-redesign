/**
 * Phase D clinical spine — stakeholder role events on the shared spine.
 * Invariants: ehrWrite:false · autoRetrain:false · liveEmis:false · physiologicalTwin:false.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { unlink } from "node:fs/promises";

import {
  SPINE_ROLE_HONESTY,
  buildNurseVitalsSample,
  buildSpineAggregates,
  recordNurseVitalsOnSpine,
  recordPharmacistReviewOnSpine
} from "../lib/clinical-spine/role-events";
import { extractBiomarkerLite } from "../lib/precision-health/biomarkers";
import { buildPatientTimeline } from "../lib/precision-health/timeline";
import { listModalitySamples } from "../lib/repositories/modality-sample-repository";
import { listLearningEvents } from "../lib/repositories/learning-event-repository";

const scopeKey = `phase_d_${Date.now()}`;
const dataDir = path.join(process.cwd(), "data");

async function run() {
  assert.equal(SPINE_ROLE_HONESTY.ehrWrite, false);
  assert.equal(SPINE_ROLE_HONESTY.liveEmis, false);
  assert.equal(SPINE_ROLE_HONESTY.physiologicalTwin, false);
  assert.equal(SPINE_ROLE_HONESTY.autoRetrain, false);
  assert.equal(SPINE_ROLE_HONESTY.writeBackPath, "sim_staging_only");

  // --- Nurse vitals sample → biomarker-lite ---
  const sampleShape = buildNurseVitalsSample("P001", {
    bpSys: "128",
    bpDia: "78",
    hr: "88",
    spo2: "96",
    rr: "16",
    temp: "36.8"
  });
  assert.equal(sampleShape.modality, "wearable");
  assert.equal(sampleShape.provenance.liveStream, false);
  assert.ok(sampleShape.provenance.note?.includes("nurse_vitals"));
  const biomarkers = extractBiomarkerLite(sampleShape);
  assert.equal(biomarkers?.heartRateBpm, 88);
  assert.equal(biomarkers?.systolicBpMmHg, 128);
  assert.equal(biomarkers?.spo2Percent, 96);

  // --- Nurse vitals on spine ---
  const nurse = await recordNurseVitalsOnSpine(
    {
      patientId: "P001",
      patientLabel: "Phase D Nurse Test",
      vitals: { bpSys: "130", bpDia: "80", hr: "90", spo2: "97" },
      updateKg: false
    },
    { scopeKey, actor: "phase-d-nurse@aksh.health" }
  );
  assert.equal(nurse.accepted, true);
  assert.equal(nurse.ehrWrite, false);
  assert.equal(nurse.liveEmis, false);
  assert.equal(nurse.physiologicalTwin, false);
  assert.equal(nurse.autoRetrain, false);
  assert.ok(nurse.sample);
  assert.ok(nurse.sample.summary.includes("Nurse observations"));

  // --- Pharmacist review → learning (timeline) ---
  const pharm = await recordPharmacistReviewOnSpine(
    {
      patientId: "P002",
      patientLabel: "Phase D Pharm Test",
      medicationCount: 4,
      medicationSummary: "4 active medications reviewed (phase-d test)"
    },
    { scopeKey, actor: "phase-d-pharmacist@aksh.health" }
  );
  assert.equal(pharm.ehrWrite, false);
  assert.equal(pharm.liveEmis, false);
  assert.ok(pharm.learningEventId);

  const samples = await listModalitySamples({ scopeKey, patientId: "P001" });
  assert.ok(samples.some((s) => s.id === nurse.sample?.id));

  const learning = await listLearningEvents({ scopeKey, limit: 50 });
  assert.ok(learning.events.some((e) => e.id === pharm.learningEventId));

  const timeline = buildPatientTimeline({
    patientId: "P001",
    modalitySamples: samples,
    learningEvents: learning.events.filter((e) => e.patientId === "P001")
  });
  assert.ok(timeline.eventCount >= 1);
  assert.ok(timeline.events.some((e) => e.kind === "modality_sample"));

  const timelineP2 = buildPatientTimeline({
    patientId: "P002",
    learningEvents: learning.events
  });
  assert.ok(timelineP2.events.some((e) => e.kind === "learning_outcome"));

  // --- Aggregates from same stores ---
  const aggregates = await buildSpineAggregates({
    scopeKey,
    patientIds: ["P001", "P002"]
  });
  assert.equal(aggregates.source, "shared_spine_apis");
  assert.equal(aggregates.ehrWrite, false);
  assert.equal(aggregates.liveEmis, false);
  assert.ok(aggregates.modalitySampleCount >= 1);
  assert.ok(aggregates.learningEventCount >= 1);

  // --- UI / docs wiring ---
  const vitalsUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/nurse/VitalsForm.tsx"),
    "utf8"
  );
  assert.ok(vitalsUi.includes("/api/clinical-spine/nurse-vitals"));
  assert.ok(vitalsUi.includes("nurse-vitals-timeline-note"));
  assert.ok(vitalsUi.includes("liveEmis:false"));

  const nursePage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/nurse/observations/page.tsx"),
    "utf8"
  );
  assert.ok(nursePage.includes("PatientTimelinePanel"));

  const pharmUi = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/pharmacist/MedReviewQueue.tsx"),
    "utf8"
  );
  assert.ok(pharmUi.includes("/api/clinical-spine/pharmacist-review"));
  assert.ok(pharmUi.includes("pharmacist-spine-note"));

  const companion = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/PatientCompanion.tsx"),
    "utf8"
  );
  assert.ok(companion.includes("HealthPlanDraftPanel"));
  assert.ok(companion.includes('mode="patient"'));
  assert.ok(companion.includes("ConsentGrantsPanel"));

  const icsPage = fs.readFileSync(path.join(process.cwd(), "app/dashboard/ics/page.tsx"), "utf8");
  assert.ok(icsPage.includes("SpineSharedEventsPanel"));

  const hospitalPage = fs.readFileSync(
    path.join(process.cwd(), "app/dashboard/hospital/page.tsx"),
    "utf8"
  );
  // Hospital surface uses ward drill-in + command map (P2 polish); shared spine events stay on ICS.
  assert.ok(hospitalPage.includes("WardPatientContext"));
  assert.ok(hospitalPage.includes("HospitalCommandMap"));
  assert.ok(!hospitalPage.includes("SpineSharedEventsPanel"));

  const spine = fs.readFileSync(
    path.join(process.cwd(), "components/dashboard/precision-health/SystemSpinePanel.tsx"),
    "utf8"
  );
  assert.ok(spine.includes("spine-phase-d-stakeholders"));
  assert.ok(spine.includes("nurse-vitals"));

  const checklist = fs.readFileSync(
    path.join(process.cwd(), "docs/CLINICAL_SPINE_PHASE_D.md"),
    "utf8"
  );
  assert.ok(checklist.includes("liveEmis: false"));
  assert.ok(checklist.includes("physiologicalTwin: false"));
  assert.ok(checklist.includes("autoRetrain: false"));
  assert.ok(checklist.includes("Phase E next"));
  assert.ok(checklist.includes("sim"));

  const nurseRoute = fs.readFileSync(
    path.join(process.cwd(), "app/api/clinical-spine/nurse-vitals/route.ts"),
    "utf8"
  );
  assert.ok(nurseRoute.includes("recordNurseVitalsOnSpine"));
  assert.ok(nurseRoute.includes("liveEmis"));

  // cleanup scoped stores if present
  for (const name of [
    `modality-samples.${scopeKey}.json`,
    `learning-events.${scopeKey}.json`,
    `consent-grants.${scopeKey}.json`,
    `health-plans.${scopeKey}.json`
  ]) {
    const file = path.join(dataDir, name);
    if (fs.existsSync(file)) await unlink(file).catch(() => undefined);
  }

  console.log(
    `Phase D clinical spine checks passed (nurseSample=${nurse.sample?.id}; pharmLearning=${pharm.learningEventId}; aggregates=${aggregates.modalitySampleCount}+${aggregates.learningEventCount}).`
  );
}

void run();
