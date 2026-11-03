/**
 * Milestone E1 — shared-run correlation:
 * - Orchestrate HTTP threads careEpisodeId + idempotencyKey + scopeKey into durable claim
 * - Care-episode + lab/pharmacy HITL prefer Postgres list with storeMode honesty
 * Synthetic / controlled data only. Does not claim clinical validation or flip RBAC.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.join(__dirname, "..");
const tmp = mkdtempSync(path.join(tmpdir(), "e1-shared-run-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

async function main() {
  // --- Docs ---
  const readme = read("docs/milestone-e/README.md");
  assert.match(readme, /Shared Run Correlation/);
  assert.match(readme, /productionRbacEnforced/);
  assert.match(readme, /test:milestone-e/);
  assert.match(readme, /clinical/i);

  const doc = read("docs/milestone-e/SHARED_RUN_CORRELATION.md");
  assert.match(doc, /Definition of done/i);
  assert.match(doc, /Non-goals/i);
  assert.match(doc, /P0\.1/);
  assert.match(doc, /P0\.2/);
  assert.match(doc, /storeMode/);
  assert.match(doc, /idempotencyKey/);
  assert.match(doc, /careEpisodeId/);
  assert.match(doc, /file_fallback/);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /liveEmis|ehrWrite/i);
  assert.match(doc, /does \*\*not\*\* flip|Not\*\* flipping|remains false/i);

  // --- P0.1 source contracts ---
  const orchRoute = read("app/api/agents/orchestrate/route.ts");
  assert.match(orchRoute, /idempotencyKey/);
  assert.match(orchRoute, /scopeKey/);
  assert.match(orchRoute, /readCareEpisodeId/);
  assert.match(orchRoute, /runClinicalSpineOrchestrate/);
  // Threading into orchestrate (before correlate) — not only post-hoc correlateCareEpisodeStage
  assert.match(
    orchRoute,
    /runClinicalSpineOrchestrate\(\{[\s\S]*careEpisodeId[\s\S]*idempotencyKey[\s\S]*scopeKey/
  );
  assert.match(orchRoute, /correlateCareEpisodeStage/);
  assert.doesNotMatch(orchRoute, /productionRbacEnforced\s*[:=]\s*true/);
  assert.doesNotMatch(orchRoute, /liveEmis\s*[:=]\s*true/);

  // --- P0.2 source contracts ---
  const careRepo = read("lib/care-episode/repository.ts");
  assert.match(careRepo, /listCareEpisodesForScopeWithMode/);
  assert.match(careRepo, /listCareEpisodesForPatientWithMode/);
  assert.match(careRepo, /getCareEpisodeWithMode/);
  assert.match(careRepo, /CareEpisodeStoreMode/);
  assert.match(careRepo, /file_fallback/);
  assert.match(careRepo, /Milestone E1/);

  const lphRepo = read("lib/repositories/lab-pharmacy-hitl-repository.ts");
  assert.match(lphRepo, /LabPharmacyHitlStoreMode/);
  assert.match(lphRepo, /storeMode/);
  assert.match(lphRepo, /upsertPostgresDraft|lab_pharmacy_hitl_drafts/);
  assert.match(lphRepo, /file_fallback/);
  assert.match(lphRepo, /Milestone E1/);

  const schema = read("lib/db/schema-sql.ts");
  assert.match(schema, /LAB_PHARMACY_HITL_SQL/);
  assert.match(schema, /lab_pharmacy_hitl_drafts/);
  const migration = read("db/migrations/055_lab_pharmacy_hitl.sql");
  assert.match(migration, /lab_pharmacy_hitl_drafts/);

  const channelSrc = read("lib/agents/ops-alert-channel.ts");
  assert.match(channelSrc, /shared_run_correlation_unified/);
  assert.match(channelSrc, /residualDualPathStores:\s*\[\]/);

  const opsPage = read("app/dashboard/admin/agent-ops/page.tsx");
  assert.match(opsPage, /agent-ops-care-episode-store-mode/);
  assert.match(opsPage, /careEpisodeStoreMode/);
  assert.match(opsPage, /productionRbacEnforced:\s*false/);
  assert.doesNotMatch(opsPage, /productionRbacEnforced\s*[:=]\s*true/);

  const lphPanel = read("components/dashboard/lab-pharmacy/LabPharmacyHitlPanel.tsx");
  assert.match(lphPanel, /lab-pharmacy-hitl-store-mode/);
  assert.match(lphPanel, /storeMode/);

  const careApi = read("app/api/patients/[id]/care-episodes/route.ts");
  assert.match(careApi, /listCareEpisodesForPatientWithMode/);
  assert.match(careApi, /storeMode/);

  const lphApi = read("app/api/lab-pharmacy-hitl/route.ts");
  assert.match(lphApi, /storeMode/);

  const opsRuns = read("app/api/agents/ops-runs/route.ts");
  assert.match(opsRuns, /listCareEpisodesForScopeWithMode/);
  assert.match(opsRuns, /careEpisodeStoreMode/);

  const pkg = read("package.json");
  assert.match(pkg, /"test:milestone-e"/);
  assert.match(pkg, /"test:milestone-e:correlate"/);

  // --- Runtime: hermetic storeMode + durable claim with careEpisodeId ---
  const {
    claimOrRecoverDurableAgentRun,
    finalizeDurableAgentRun,
    findDurableAgentRunByIdempotencyKey,
    resetDurableAgentRunStoreForTests,
  } = await import("../lib/agents/execution-run-store");
  const {
    createCareEpisode,
    listCareEpisodesForScopeWithMode,
    listCareEpisodesForPatientWithMode,
    resetCareEpisodeStoreForTests,
  } = await import("../lib/care-episode/repository");
  const {
    stageAndPersistLabPharmacyDraft,
    listLabPharmacyDrafts,
    resetLabPharmacyHitlStoreForTests,
  } = await import("../lib/repositories/lab-pharmacy-hitl-repository");
  const { buildOpsAlertChannelPayload } = await import("../lib/agents/ops-alert-channel");
  const { buildOpsAlerts } = await import("../lib/agents/ops-alerts");

  const scope = "e1-correlate-scope";
  await resetDurableAgentRunStoreForTests(scope);
  await resetCareEpisodeStoreForTests(scope);
  await resetLabPharmacyHitlStoreForTests(scope);

  const episode = await createCareEpisode({
    patientId: "pt-e1-synthetic",
    patientLabel: "SHOULD_NEVER_APPEAR_IN_OPS",
    createdBy: "e1@test.aksh",
    scopeKey: scope,
    pathway: "synthetic_e1",
    idempotencyKey: `e1-ce-${Date.now()}`,
  });

  const idem = `e1-orch-idem-${Date.now()}`;
  const claim = await claimOrRecoverDurableAgentRun({
    scopeKey: scope,
    patientId: "pt-e1-synthetic",
    patientLabel: "SHOULD_NEVER_APPEAR_IN_OPS",
    correlationId: "e1-corr-1",
    careEpisodeId: episode.id,
    idempotencyKey: idem,
    organisationId: "practice-e1",
  });
  assert.equal(claim.outcome, "claimed");
  assert.equal(claim.record.careEpisodeId, episode.id);
  await finalizeDurableAgentRun({
    ...claim.record,
    status: "completed",
    completedAt: new Date().toISOString(),
    draftEnqueueAllowed: true,
    shieldAuditPersisted: true,
    careEpisodeId: episode.id,
    execution: {
      ...claim.record.execution,
      status: "completed",
      completedAt: new Date().toISOString(),
      durationMs: 9,
    },
  });

  const recovered = await findDurableAgentRunByIdempotencyKey(idem, scope);
  assert.ok(recovered);
  assert.equal(recovered!.careEpisodeId, episode.id);
  assert.equal(recovered!.idempotencyKey, idem);

  const replay = await claimOrRecoverDurableAgentRun({
    scopeKey: scope,
    patientId: "pt-e1-synthetic",
    patientLabel: "SHOULD_NEVER_APPEAR_IN_OPS",
    correlationId: "e1-corr-replay",
    careEpisodeId: episode.id,
    idempotencyKey: idem,
  });
  assert.equal(replay.outcome, "recovered");
  assert.equal(replay.record.careEpisodeId, episode.id);

  const ceListed = await listCareEpisodesForScopeWithMode(scope, 20);
  assert.equal(ceListed.storeMode, "file");
  assert.ok(ceListed.episodes.some((e) => e.id === episode.id));

  const cePatient = await listCareEpisodesForPatientWithMode("pt-e1-synthetic", scope);
  assert.equal(cePatient.storeMode, "file");
  assert.ok(cePatient.episodes.some((e) => e.id === episode.id));

  const staged = await stageAndPersistLabPharmacyDraft(
    {
      kind: "lab",
      syntheticPatientId: "hcp-synth-patel",
      items: ["HbA1c"],
      careEpisodeId: episode.id,
      organisationId: "practice-e1",
      scopeKey: scope,
      actor: "gp@e1.test",
    },
    { role: "clinical_reviewer", persona: "gp", practiceId: "practice-e1" }
  );
  assert.equal(staged.storeMode, "file");
  assert.equal(staged.source, "file");
  assert.equal(staged.draft.careEpisodeId, episode.id);

  const lphListed = await listLabPharmacyDrafts({
    scopeKey: scope,
    kind: "lab",
    status: "open",
  });
  assert.equal(lphListed.storeMode, "file");
  assert.ok(lphListed.drafts.some((d) => d.id === staged.draft.id && d.careEpisodeId === episode.id));

  // Postgres branch contracts present (hermetic path stays file)
  assert.match(careRepo, /storeMode:\s*"postgres"/);
  assert.match(lphRepo, /storeMode:\s*"postgres"/);
  assert.match(lphRepo, /storeMode:\s*"file_fallback"/);

  const alerts = await buildOpsAlerts({ scopeKey: scope, dispatchChannel: false });
  const payload = buildOpsAlertChannelPayload(alerts);
  assert.equal(payload.dualPathResidual, "shared_run_correlation_unified");
  assert.deepEqual(payload.residualDualPathStores, []);
  assert.equal(payload.productionRbacEnforced, false);
  assert.equal(payload.certificationClaim, false);
  assert.equal(payload.ehrWrite, false);

  console.log(
    "milestone-e1-shared-run-correlation: orchestrate threading + storeMode honesty — PASS"
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    process.chdir(prevCwd);
    if (prevDbUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDbUrl;
    if (prevUsePg === undefined) delete process.env.USE_POSTGRES;
    else process.env.USE_POSTGRES = prevUsePg;
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });
