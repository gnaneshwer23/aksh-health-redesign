import assert from "node:assert/strict";
import { mkdir, unlink } from "fs/promises";
import path from "path";

import {
  SYNTHETIC_MODALITY_FIXTURES,
  buildIngestionStubResponse,
  buildNutritionCoachingDraft,
  buildPatientRiskState,
  buildPersonalisedHealthPlanDraft,
  buildPatientTimeline,
  buildSleepCoachingDraft,
  listModalityContractSummaries,
  parseModalitySample
} from "../lib/precision-health";
import { getPatientById } from "../lib/mock-data";
import {
  listConsentGrants,
  upsertConsentGrant
} from "../lib/repositories/consent-grant-repository";
import {
  ensureSyntheticModalityFixtures,
  ingestModalitySampleStub,
  listModalitySamples
} from "../lib/repositories/modality-sample-repository";
import { createHealthPlanDraft } from "../lib/repositories/health-plan-repository";

async function run() {
  // --- Modality contracts ---
  const contracts = listModalityContractSummaries();
  assert.equal(contracts.length, 7);
  assert.ok(contracts.every((c) => c.liveStreamSupported === false));

  for (const fixture of SYNTHETIC_MODALITY_FIXTURES) {
    const parsed = parseModalitySample(fixture);
    assert.equal(parsed.provenance.liveStream, false);
    assert.equal(parsed.provenance.realPatientData, false);
  }

  const stub = buildIngestionStubResponse("wearable");
  assert.equal(stub.liveStream, false);

  // --- Consent registry ---
  const scopeKey = `ph1_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  const { grant, action } = await upsertConsentGrant(
    {
      patientId: "P001",
      purposeCode: "care_delivery",
      modalities: ["wearable", "lifestyle", "clinical", "lab"],
      grantedBy: "test-clinician@aksh.health"
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(action, "grant");
  assert.equal(grant.status, "active");
  assert.equal(grant.ehrWrite, false);

  const listed = await listConsentGrants({ scopeKey, patientId: "P001" });
  assert.ok(listed.some((g) => g.id === grant.id));

  // --- Modality ingest respects consent ---
  await ensureSyntheticModalityFixtures(scopeKey);
  const samples = await listModalitySamples({ scopeKey, patientId: "P001" });
  assert.ok(samples.length >= 1);

  const rejected = await ingestModalitySampleStub(
    {
      modality: "environment",
      patientId: "P001",
      recordedAt: "2026-07-18T12:00:00.000Z",
      summary: "Should fail — no environment grant",
      provenance: { source: "ingestion_stub", liveStream: false, realPatientData: false }
    },
    { scopeKey, purposeCode: "care_delivery" }
  );
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.liveStream, false);

  const accepted = await ingestModalitySampleStub(
    {
      modality: "wearable",
      patientId: "P001",
      recordedAt: "2026-07-18T12:00:00.000Z",
      restingHeartRateBpm: 88,
      summary: "Consented wearable stub sample",
      provenance: { source: "ingestion_stub", liveStream: false, realPatientData: false }
    },
    { scopeKey, purposeCode: "care_delivery" }
  );
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.liveStream, false);

  const { grant: revoked, action: revokeAction } = await upsertConsentGrant(
    {
      patientId: "P001",
      purposeCode: "care_delivery",
      modalities: ["wearable"],
      grantedBy: "test-clinician@aksh.health",
      revokeGrantId: grant.id
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(revokeAction, "revoke");
  assert.equal(revoked.status, "revoked");

  // --- Timeline merge ---
  const timeline = buildPatientTimeline({
    patientId: "P001",
    patientLabelHint: "Sarah Johnson",
    modalitySamples: samples,
    consentGrants: [grant, revoked],
    learningEvents: []
  });
  assert.ok(timeline.eventCount >= 1);
  assert.ok(timeline.note.toLowerCase().includes("not a production"));

  // --- Health plan draft ---
  const patient = getPatientById("P001");
  assert.ok(patient);
  const plan = buildPersonalisedHealthPlanDraft({
    patientId: "P001",
    patientLabel: patient.name,
    createdBy: "test-clinician@aksh.health",
    trigger: "hitl_accept",
    conditions: patient.activeConditions,
    medications: patient.activeMedications,
    riskSignals: patient.digitalTwinPrediction.deteriorationSignals
  });
  assert.equal(plan.status, "DRAFT");
  assert.equal(plan.ehrWrite, false);
  assert.equal(plan.hitlRequired, true);
  assert.equal(plan.physiologicalTwin, false);

  const storedPlan = await createHealthPlanDraft(
    {
      patientId: "P001",
      patientLabel: patient.name,
      createdBy: "test-clinician@aksh.health",
      trigger: "manual_request"
    },
    { scopeKey }
  );
  assert.equal(storedPlan.ehrWrite, false);

  // --- Risk state honesty ---
  const risk = buildPatientRiskState(patient);
  assert.equal(risk.physiologicalTwin, false);
  assert.equal(risk.simulationRanking, false);
  assert.equal(risk.modelLabel, "risk_state_model");
  assert.ok(risk.limitations.some((l) => l.toLowerCase().includes("not a physiological")));

  // --- Coaching stubs ---
  const nutrition = buildNutritionCoachingDraft({ patientId: "P001", patientLabel: patient.name });
  assert.equal(nutrition.isClinicalAdvice, false);
  assert.equal(nutrition.ehrWrite, false);
  assert.ok(nutrition.disclaimers.some((d) => d.includes("NOT CLINICAL ADVICE")));

  const sleep = buildSleepCoachingDraft({ patientId: "P001" });
  assert.equal(sleep.isClinicalAdvice, false);
  assert.equal(sleep.agentId, "SLEEP");

  // Cleanup scoped files (best effort)
  for (const name of [
    `consent-grants.${scopeKey}.json`,
    `modality-samples.${scopeKey}.json`,
    `health-plans.${scopeKey}.json`
  ]) {
    try {
      await unlink(path.join(dataDir, name));
    } catch {
      /* ignore */
    }
  }

  console.log("precision-health-phase1.test.ts: ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
