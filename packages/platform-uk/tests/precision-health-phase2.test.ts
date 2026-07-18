import assert from "node:assert/strict";
import { mkdir, unlink } from "fs/promises";
import path from "path";

import {
  buildExerciseCoachingDraft,
  buildMentalHealthCoachingDraft,
  getEmisPartnerChecklist,
  getOracleModelCard,
  listConnectorStatuses,
  mergeModalitySampleIntoKg,
  runIngestionPipeline
} from "../lib/precision-health";
import { dryRunMedplumStagingSync, getMedplumRehearsalStatus } from "../lib/medplum-client";
import { upsertConsentGrant } from "../lib/repositories/consent-grant-repository";

async function run() {
  // --- Connector registry honesty ---
  const connectors = listConnectorStatuses();
  assert.ok(connectors.some((c) => c.id === "wearable_synthetic_stream"));
  assert.ok(connectors.some((c) => c.id === "lifestyle_diary"));
  assert.ok(connectors.some((c) => c.id === "fitbit_oauth_stub"));
  assert.ok(connectors.some((c) => c.id === "file_import"));

  const previousFitbitId = process.env.FITBIT_CLIENT_ID;
  const previousFitbitSecret = process.env.FITBIT_CLIENT_SECRET;
  delete process.env.FITBIT_CLIENT_ID;
  delete process.env.FITBIT_CLIENT_SECRET;

  const fitbitOff = listConnectorStatuses().find((c) => c.id === "fitbit_oauth_stub");
  assert.ok(fitbitOff);
  assert.equal(fitbitOff!.liveStream, false);

  process.env.FITBIT_CLIENT_ID = "test-client";
  process.env.FITBIT_CLIENT_SECRET = "test-secret";
  const fitbitOn = listConnectorStatuses().find((c) => c.id === "fitbit_oauth_stub");
  assert.equal(fitbitOn!.liveStream, true);

  if (previousFitbitId === undefined) delete process.env.FITBIT_CLIENT_ID;
  else process.env.FITBIT_CLIENT_ID = previousFitbitId;
  if (previousFitbitSecret === undefined) delete process.env.FITBIT_CLIENT_SECRET;
  else process.env.FITBIT_CLIENT_SECRET = previousFitbitSecret;

  // Restore clean no-key state for remaining asserts
  delete process.env.FITBIT_CLIENT_ID;
  delete process.env.FITBIT_CLIENT_SECRET;
  assert.equal(
    listConnectorStatuses().find((c) => c.id === "fitbit_oauth_stub")!.liveStream,
    false
  );

  // --- Consent-gated ingest pipeline ---
  const scopeKey = `ph2_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  await upsertConsentGrant(
    {
      patientId: "P001",
      purposeCode: "care_delivery",
      modalities: ["wearable", "lifestyle"],
      grantedBy: "test-clinician@aksh.health"
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );

  const refused = await runIngestionPipeline(
    {
      connectorId: "wearable_synthetic_stream",
      purposeCode: "care_delivery",
      patientId: "P999-no-grant",
      updateKg: false
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(refused.accepted, false);
  assert.equal(refused.liveStream, false);
  assert.equal(refused.ehrWrite, false);

  const accepted = await runIngestionPipeline(
    {
      connectorId: "wearable_synthetic_stream",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: true
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.liveStream, false);
  assert.equal(accepted.ehrWrite, false);
  assert.ok(accepted.sample);
  // KG: mock skip when Neo4j not live in CI
  assert.ok(["mock", "live"].includes(accepted.kg.mode));
  if (accepted.kg.mode === "mock") {
    assert.equal(accepted.kg.applied, false);
  }

  const lifestyle = await runIngestionPipeline(
    {
      connectorId: "lifestyle_diary",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(lifestyle.accepted, true);

  // Direct KG helper skips honestly when mock
  const kgSkip = await mergeModalitySampleIntoKg(accepted.sample!, { consentAllowsKg: true });
  assert.ok(["mock", "live"].includes(kgSkip.mode));

  // --- ORACLE model card ---
  const card = getOracleModelCard();
  assert.equal(card.autoRetrain, false);
  assert.equal(card.physiologicalTwin, false);
  assert.ok(card.governedReleaseSop.includes("GOVERNED_MODEL_RELEASE_SOP"));
  assert.ok(card.clinicalOwner.includes("UNASSIGNED") || card.clinicalOwner.length > 0);
  assert.ok(card.evalHarnessRef.length > 0);

  // --- EMIS partner checklist ---
  const checklist = getEmisPartnerChecklist();
  assert.equal(checklist.liveEmis, false);
  assert.equal(checklist.liveWriteBack, false);
  assert.ok(checklist.items.some((i) => i.id === "writeback-decision"));
  assert.ok(checklist.partnerChecklistDoc.includes("PHASE2_PARTNER_CHECKLIST"));

  // --- Medplum dry-run when disabled ---
  const prevMedplum = process.env.ENABLE_MEDPLUM_SYNC;
  delete process.env.ENABLE_MEDPLUM_SYNC;
  const medplumStatus = getMedplumRehearsalStatus();
  assert.equal(medplumStatus.dryRunEligible, false);
  const dry = await dryRunMedplumStagingSync();
  assert.equal(dry.attempted, false);
  assert.equal(dry.liveEmis, false);
  if (prevMedplum === undefined) delete process.env.ENABLE_MEDPLUM_SYNC;
  else process.env.ENABLE_MEDPLUM_SYNC = prevMedplum;

  // --- Coaching expansion ---
  const exercise = buildExerciseCoachingDraft({ patientId: "P001" });
  assert.equal(exercise.isClinicalAdvice, false);
  assert.equal(exercise.ehrWrite, false);
  assert.equal(exercise.agentId, "EXERCISE");
  assert.ok(exercise.disclaimers.some((d) => d.includes("NOT CLINICAL ADVICE")));

  const mh = buildMentalHealthCoachingDraft({ patientId: "P001" });
  assert.equal(mh.agentId, "MENTAL_HEALTH");
  assert.equal(mh.isClinicalAdvice, false);
  assert.ok(mh.clinicalEscalationHints.some((h) => h.toLowerCase().includes("crisis") || h.toLowerCase().includes("suicidal")));

  // --- Route / doc smoke ---
  const { readFile } = await import("fs/promises");
  const files = [
    "app/api/precision-health/ingest/route.ts",
    "app/api/precision-health/connectors/route.ts",
    "app/api/integrations/emis-partner-checklist/route.ts",
    "app/api/agents/exercise/route.ts",
    "app/api/agents/mental-health/route.ts",
    "docs/PHASE2_PARTNER_CHECKLIST.md",
    "docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md",
    "components/dashboard/precision-health/ConnectorsIngestPanel.tsx",
    "app/dashboard/admin/precision-health/page.tsx"
  ];
  for (const rel of files) {
    const src = await readFile(path.join(process.cwd(), rel), "utf8");
    assert.ok(src.length > 50, `${rel} should exist`);
  }

  const connectorsUi = await readFile(
    path.join(process.cwd(), "components/dashboard/precision-health/ConnectorsIngestPanel.tsx"),
    "utf8"
  );
  assert.ok(connectorsUi.includes("Fitbit stub disabled"));
  assert.ok(connectorsUi.includes("/api/precision-health/ingest"));

  const oracleRoute = await readFile(
    path.join(process.cwd(), "app/api/agents/oracle/route.ts"),
    "utf8"
  );
  assert.ok(oracleRoute.includes("getOracleModelCard"));
  assert.ok(oracleRoute.includes("autoRetrain: false"));

  const coachingUi = await readFile(
    path.join(process.cwd(), "components/dashboard/precision-health/CoachingDraftPanel.tsx"),
    "utf8"
  );
  assert.ok(coachingUi.includes("exercise"));
  assert.ok(coachingUi.includes("mental-health"));
  assert.ok(coachingUi.includes("NOT CLINICAL ADVICE"));

  for (const name of [
    `consent-grants.${scopeKey}.json`,
    `modality-samples.${scopeKey}.json`
  ]) {
    try {
      await unlink(path.join(dataDir, name));
    } catch {
      /* ignore */
    }
  }

  console.log("precision-health-phase2.test.ts: ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
