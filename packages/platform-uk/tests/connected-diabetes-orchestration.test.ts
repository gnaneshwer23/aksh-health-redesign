/**
 * INT-01 / INT-02 / INT-03 / INT-04 / follow-up facade — connected diabetes orchestration + store facades.
 * File-store path (no Postgres). ehrWrite must stay false. Neon production untouched.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tmp = mkdtempSync(path.join(tmpdir(), "cdi-orch-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const {
    runConnectedDiabetesPipeline,
    buildConnectedDiabetesOrchestration,
  } = await import("../lib/diabetes-intelligence/connected-journey-orchestrate");
  const {
    loadUnifiedGlucoseObservations,
    recordGlucoseViaBridge,
    GLUCOSE_CANONICAL_STORE,
  } = await import("../lib/diabetes-intelligence/glucose-bridge");
  const { listUnifiedCarePlans } = await import("../lib/diabetes-intelligence/care-plan-facade");
  const { listUnifiedFollowUps } = await import("../lib/diabetes-intelligence/follow-up-facade");
  const { listUnifiedMedRecons, selectOpenMedRecons } = await import(
    "../lib/diabetes-intelligence/med-recon-facade"
  );
  const { listGlucoseSeries } = await import("../lib/diabetes-intelligence/glucose-repository");
  const { buildSharedPatientContextAsync } = await import(
    "../lib/diabetes-intelligence/agent-intel-context"
  );
  const { decideJourneyCarePlan, draftJourneyCarePlan, seedSyntheticJourney } = await import(
    "../lib/diabetes-intelligence/journey"
  );
  const { startCanonicalMedReconciliation, MED_RECON_PHYSICAL_STORE } = await import(
    "../lib/patient-intelligence/med-recon-canonical"
  );
  const { startMedicationReconciliation } = await import("../lib/patient-intelligence");
  const { startMedCareReconciliation } = await import("../lib/diabetes-intelligence/medcare-assemble");

  const scopeKey = `orch_${Date.now()}`;
  const patientId = "P002";

  // INT-02: bridge write lands in canonical series
  const bridged = await recordGlucoseViaBridge(
    {
      patientId,
      reading: {
        recordedAt: "2026-10-28T08:00:00.000Z",
        glucoseMgDl: 155,
        context: "fasting",
      },
    },
    { scopeKey, sourceSystem: "test_bridge" }
  );
  assert.equal(bridged.ehrWrite, false);
  assert.equal(bridged.canonicalStore, GLUCOSE_CANONICAL_STORE);
  const series = await listGlucoseSeries(patientId, { scopeKey });
  assert.ok(series.some((r) => r.channel === "smbg" && r.valueNumeric === 155));
  const unifiedGlu = await loadUnifiedGlucoseObservations(patientId, { scopeKey });
  assert.ok(unifiedGlu.fromCanonicalSeries);
  assert.ok(unifiedGlu.observations.some((o) => o.glucoseMgDl === 155));

  // INT-01: full pipeline
  const run = await runConnectedDiabetesPipeline(patientId, {
    scopeKey,
    actor: "test@aksh.health",
    mode: "run_pipeline",
  });
  assert.equal(run.synthetic, true);
  assert.equal(run.ehrWrite, false);
  assert.equal(run.hitlRequired, true);
  assert.equal(run.autonomousPrescribe, false);
  assert.equal(run.liveOrganisations, 0);
  assert.equal(run.capabilityStatus, "synthetic_demo");
  assert.ok(run.phasesExecuted.every((p) => p.ok), JSON.stringify(run.phasesExecuted));
  assert.ok(run.phasesExecuted.some((p) => p.stepId === "patient-360"));
  assert.ok(run.phasesExecuted.some((p) => p.stepId === "glucose"));
  assert.ok(run.phasesExecuted.some((p) => p.stepId === "journey" && p.action === "draft_care_plan"));
  assert.ok(run.phasesExecuted.some((p) => p.stepId === "agent"));
  assert.ok(run.steps.length >= 7);

  // INT-03: unified care plans include journey draft with provenance
  const plans = await listUnifiedCarePlans(patientId, { scopeKey });
  assert.ok(plans.length >= 1, "expected at least one care plan after pipeline");
  assert.ok(plans.every((p) => p.ehrWrite === false && p.hitlRequired === true));
  assert.ok(plans.some((p) => p.sourceStore === "journey_care_plan" && p.provenance === "journey_hitl"));
  assert.ok(plans.every((p) => p.unifiedKey.includes(":")));

  // Shared context reflects live modules
  const ctx = await buildSharedPatientContextAsync(patientId, { scopeKey });
  assert.equal(ctx.ehrWrite, false);
  assert.ok(ctx.sources.some((s) => s.module === "glucose_intelligence" && s.available));
  assert.ok(ctx.sources.some((s) => s.module === "diabetes_journey" && s.available));

  // Idempotent reuse path
  const again = await runConnectedDiabetesPipeline(patientId, {
    scopeKey,
    actor: "test@aksh.health",
    mode: "run_pipeline",
  });
  assert.equal(again.ehrWrite, false);
  assert.ok(again.phasesExecuted.some((p) => p.action === "reuse"));

  const status = await buildConnectedDiabetesOrchestration(patientId, { scopeKey });
  assert.equal(status.ehrWrite, false);
  assert.ok(status.unifiedCarePlans.length >= 1);

  // Follow-up dual-store facade + bridge (INT-04-adjacent)
  await seedSyntheticJourney(patientId, { scopeKey, actor: "test@aksh.health" });
  const draftSnap = await draftJourneyCarePlan(patientId, {
    scopeKey,
    createdBy: "test@aksh.health",
  });
  const draft = draftSnap.carePlans.find((p) => p.status === "DRAFT");
  assert.ok(draft, "expected draft care plan for follow-up bridge");
  await decideJourneyCarePlan(
    {
      patientId,
      planId: draft!.id,
      action: "accept",
      actor: "test@aksh.health",
      actorPersona: "gp",
    },
    { scopeKey, organisationId: "practice-demo" }
  );
  const followUps = await listUnifiedFollowUps(patientId, { scopeKey });
  assert.ok(followUps.some((f) => f.sourceStore === "journey_follow_up"));
  assert.ok(
    followUps.some((f) => f.sourceStore === "continuous_care_follow_up"),
    "journey accept should mirror into continuous-care follow-up store"
  );
  assert.ok(followUps.every((f) => f.ehrWrite === false && f.unifiedKey.includes(":")));

  const status2 = await buildConnectedDiabetesOrchestration(patientId, { scopeKey });
  assert.ok(status2.unifiedFollowUps.length >= 1);

  // INT-04: dual entry surfaces share one physical store + dedupe open runs
  const from360 = await startCanonicalMedReconciliation(patientId, {
    scopeKey,
    createdBy: "p360@aksh.health",
    entrySurface: "patient360",
  });
  assert.equal(from360.physicalStore, MED_RECON_PHYSICAL_STORE);
  assert.equal(from360.ehrWrite, false);
  assert.equal(from360.autonomousPrescribe, false);
  const firstId = from360.run.id;
  const fromMedcare = await startCanonicalMedReconciliation(patientId, {
    scopeKey,
    createdBy: "medcare@aksh.health",
    entrySurface: "medcare",
  });
  assert.equal(fromMedcare.reused, true);
  assert.equal(fromMedcare.run.id, firstId, "second entry must reuse open run");
  // Surface wrappers also dedupe
  await startMedicationReconciliation(patientId, {
    scopeKey,
    createdBy: "p360-wrap@aksh.health",
  });
  await startMedCareReconciliation(patientId, {
    scopeKey,
    createdBy: "medcare-wrap@aksh.health",
  });
  const unifiedMed = await listUnifiedMedRecons(patientId, { scopeKey });
  assert.ok(unifiedMed.length >= 1);
  assert.ok(unifiedMed.every((r) => r.ehrWrite === false && r.unifiedKey.includes("medrecon:")));
  assert.ok(unifiedMed.every((r) => r.sourceStore === "medication_reconciliation_runs"));
  const openUnified = selectOpenMedRecons(unifiedMed);
  assert.equal(openUnified.length, 1, "exactly one open med-recon across dual entry points");
  const status3 = await buildConnectedDiabetesOrchestration(patientId, { scopeKey });
  assert.ok(status3.unifiedMedRecons.length >= 1);
  assert.ok(status3.unifiedMedRecons.every((r) => r.ehrWrite === false));

  console.log("connected-diabetes-orchestration: INT-01/02/03/04 + follow-up facade — PASS");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl !== undefined) process.env.DATABASE_URL = prevDbUrl;
    else delete process.env.DATABASE_URL;
    if (prevUsePg !== undefined) process.env.USE_POSTGRES = prevUsePg;
    else delete process.env.USE_POSTGRES;
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
