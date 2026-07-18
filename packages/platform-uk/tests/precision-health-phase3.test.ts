import assert from "node:assert/strict";
import { mkdir, unlink } from "fs/promises";
import path from "path";

import {
  buildCausalHypothesis,
  createFederatedJob,
  getFederatedResearchStatus,
  getPayerVbcMetrics,
  getPharmaRweSummary,
  getTwinSimulationStatus,
  listConnectorStatuses,
  resetFederatedJobStoreForTests,
  runIngestionPipeline,
  runScenario
} from "../lib/precision-health";
import { upsertConsentGrant } from "../lib/repositories/consent-grant-repository";

async function run() {
  // --- Phase 3 connectors honesty ---
  const connectors = listConnectorStatuses();
  assert.ok(connectors.some((c) => c.id === "imaging_dicom_meta_stub"));
  assert.ok(connectors.some((c) => c.id === "omics_panel_stub"));
  assert.ok(connectors.some((c) => c.id === "environment_openweather_stub"));

  const imaging = connectors.find((c) => c.id === "imaging_dicom_meta_stub")!;
  assert.equal(imaging.liveStream, false);
  assert.equal(imaging.modality, "imaging_meta");

  const omics = connectors.find((c) => c.id === "omics_panel_stub")!;
  assert.equal(omics.liveStream, false);

  const prevWeather = process.env.OPENWEATHER_API_KEY;
  delete process.env.OPENWEATHER_API_KEY;
  assert.equal(
    listConnectorStatuses().find((c) => c.id === "environment_openweather_stub")!.liveStream,
    false
  );
  process.env.OPENWEATHER_API_KEY = "test-key";
  assert.equal(
    listConnectorStatuses().find((c) => c.id === "environment_openweather_stub")!.liveStream,
    true
  );
  if (prevWeather === undefined) delete process.env.OPENWEATHER_API_KEY;
  else process.env.OPENWEATHER_API_KEY = prevWeather;
  delete process.env.OPENWEATHER_API_KEY;

  // --- Consent-gated Phase 3 ingest ---
  const scopeKey = `ph3_${Date.now()}`;
  const dataDir = path.join(process.cwd(), "data");
  await mkdir(dataDir, { recursive: true });

  await upsertConsentGrant(
    {
      patientId: "P001",
      purposeCode: "care_delivery",
      modalities: ["imaging_meta", "omics_meta", "environment"],
      grantedBy: "test-clinician@aksh.health"
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );

  const imagingIngest = await runIngestionPipeline(
    {
      connectorId: "imaging_dicom_meta_stub",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(imagingIngest.accepted, true);
  assert.equal(imagingIngest.liveStream, false);
  assert.equal(imagingIngest.ehrWrite, false);
  assert.equal(imagingIngest.sample?.modality, "imaging_meta");
  assert.ok(imagingIngest.sample && "dicomPresent" in imagingIngest.sample);
  assert.equal(
    imagingIngest.sample && "dicomPresent" in imagingIngest.sample
      ? imagingIngest.sample.dicomPresent
      : true,
    false
  );

  const omicsIngest = await runIngestionPipeline(
    {
      connectorId: "omics_panel_stub",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(omicsIngest.accepted, true);
  assert.ok(omicsIngest.sample && "rawOmicsPresent" in omicsIngest.sample);
  assert.equal(
    omicsIngest.sample && "rawOmicsPresent" in omicsIngest.sample
      ? omicsIngest.sample.rawOmicsPresent
      : true,
    false
  );

  const envIngest = await runIngestionPipeline(
    {
      connectorId: "environment_openweather_stub",
      purposeCode: "care_delivery",
      patientId: "P001",
      updateKg: false
    },
    { scopeKey, actor: "test-clinician@aksh.health" }
  );
  assert.equal(envIngest.accepted, true);
  assert.equal(envIngest.liveStream, false);

  // --- Twin simulation synthetic mode ---
  const status = getTwinSimulationStatus();
  assert.equal(status.physiologicalTwin, false);
  assert.equal(status.simulationMode, "synthetic_rules");
  assert.equal(status.ehrWrite, false);
  assert.equal(status.hitlRequired, true);
  assert.equal(status.planPromotionRequiresHitl, true);

  const sim = runScenario("P001");
  assert.equal(sim.physiologicalTwin, false);
  assert.equal(sim.simulationMode, "synthetic_rules");
  assert.equal(sim.ehrWrite, false);
  assert.equal(sim.hitlRequired, true);
  assert.ok(sim.options.length >= 2);
  assert.equal(sim.options[0]!.rank, 1);
  assert.ok(sim.limitations.some((l) => l.toLowerCase().includes("not a validated physiological")));
  assert.ok(!sim.limitations.some((l) => /living digital twin approved/i.test(l)));

  // --- Causal stub ---
  const causal = buildCausalHypothesis({ patientId: "P001" });
  assert.equal(causal.mode, "hypothesis_only");
  assert.equal(causal.disclaimer, "hypothesis only, not causal proof");
  assert.equal(causal.ehrWrite, false);
  assert.equal(causal.hitlRequired, true);
  assert.ok(causal.modelCard.clinicalOwner.includes("UNASSIGNED"));
  assert.equal(causal.modelCard.physiologicalCausalModel, false);
  assert.ok(causal.hypothesizedDrivers.length >= 2);
  assert.ok(causal.hypothesizedDrivers.every((d) => d.confidence >= 0 && d.confidence <= 1));

  // --- Federated ethics gate ---
  resetFederatedJobStoreForTests();
  const prevEthics = process.env.FEDERATED_RESEARCH_ETHICS_APPROVED;
  delete process.env.FEDERATED_RESEARCH_ETHICS_APPROVED;

  const blocked = createFederatedJob({
    title: "Blocked ethics test",
    ethicsApprovedClaim: true
  });
  assert.equal(blocked.status, "blocked_ethics");
  assert.equal(blocked.ethicsGatePassed, false);
  assert.equal(blocked.patientLevelExport, false);
  assert.equal(blocked.syntheticAggregatesOnly, true);
  assert.equal(blocked.aggregate, null);

  process.env.FEDERATED_RESEARCH_ETHICS_APPROVED = "true";
  const allowed = createFederatedJob({
    title: "Synthetic aggregate test",
    ethicsApprovedClaim: true
  });
  assert.equal(allowed.status, "completed");
  assert.equal(allowed.ethicsGatePassed, true);
  assert.equal(allowed.patientLevelExport, false);
  assert.ok(allowed.aggregate);
  assert.ok(allowed.aggregate!.cohortSizeSynthetic > 0);

  const stillBlockedWithoutClaim = createFederatedJob({
    title: "Missing claim",
    ethicsApprovedClaim: false
  });
  assert.equal(stillBlockedWithoutClaim.status, "blocked_ethics");

  const fedStatus = getFederatedResearchStatus();
  assert.equal(fedStatus.liveFederatedLearning, false);
  assert.equal(fedStatus.patientLevelExportDefault, false);
  assert.equal(fedStatus.ehrWrite, false);

  if (prevEthics === undefined) delete process.env.FEDERATED_RESEARCH_ETHICS_APPROVED;
  else process.env.FEDERATED_RESEARCH_ETHICS_APPROVED = prevEthics;

  // --- Pharma / payer honesty ---
  const rwe = getPharmaRweSummary();
  assert.equal(rwe.livePharmaIntegration, false);
  assert.equal(rwe.ehrWrite, false);
  assert.ok(rwe.note.toLowerCase().includes("not a live"));

  const vbc = getPayerVbcMetrics();
  assert.equal(vbc.livePayerIntegration, false);
  assert.equal(vbc.ehrWrite, false);

  // --- Route / doc smoke ---
  const { readFile } = await import("fs/promises");
  const files = [
    "app/api/precision-health/twin/simulate/route.ts",
    "app/api/precision-health/twin/status/route.ts",
    "app/api/agents/causal/route.ts",
    "app/api/research/federated/jobs/route.ts",
    "app/api/integrations/pharma-rwe/route.ts",
    "app/api/integrations/payer-vbc/route.ts",
    "docs/PHASE3_REGULATORY_PATH.md",
    "components/dashboard/precision-health/ScenarioRankingPanel.tsx",
    "components/dashboard/precision-health/FederatedJobsPanel.tsx",
    "components/dashboard/precision-health/PharmaPayerStubPanel.tsx"
  ];
  for (const rel of files) {
    const src = await readFile(path.join(process.cwd(), rel), "utf8");
    assert.ok(src.length > 50, `${rel} should exist`);
  }

  const twinRoute = await readFile(
    path.join(process.cwd(), "app/api/precision-health/twin/simulate/route.ts"),
    "utf8"
  );
  assert.ok(twinRoute.includes("ehrWrite: false"));
  assert.ok(twinRoute.includes("physiologicalTwin"));

  const causalRoute = await readFile(
    path.join(process.cwd(), "app/api/agents/causal/route.ts"),
    "utf8"
  );
  assert.ok(causalRoute.includes("hypothesis only, not causal proof"));
  assert.ok(causalRoute.includes("ehrWrite: false"));

  const ui = await readFile(
    path.join(process.cwd(), "components/dashboard/precision-health/ScenarioRankingPanel.tsx"),
    "utf8"
  );
  assert.ok(ui.includes("not a living digital twin"));
  assert.ok(ui.includes("ehrWrite: false"));

  const roadmap = await readFile(
    path.join(process.cwd(), "docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md"),
    "utf8"
  );
  assert.ok(roadmap.includes("PHASE3_REGULATORY_PATH"));
  assert.ok(roadmap.includes("synthetic_rules"));

  for (const name of [`consent-grants.${scopeKey}.json`, `modality-samples.${scopeKey}.json`]) {
    try {
      await unlink(path.join(dataDir, name));
    } catch {
      /* ignore */
    }
  }

  console.log("precision-health-phase3.test.ts: ok");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
