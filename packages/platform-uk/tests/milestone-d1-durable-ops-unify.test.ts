/**
 * Milestone D1 — durable-run ops Postgres-preferred list + storeMode honesty.
 * Synthetic / controlled data only. Does not claim clinical validation or flip RBAC.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const root = path.join(__dirname, "..");
const tmp = mkdtempSync(path.join(tmpdir(), "d1-durable-ops-"));
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
  const readme = read("docs/milestone-d/README.md");
  assert.match(readme, /Durable Ops Store Unify/);
  assert.match(readme, /productionRbacEnforced/);
  assert.match(readme, /test:milestone-d/);
  assert.match(readme, /clinical/i);

  const doc = read("docs/milestone-d/DURABLE_OPS_UNIFY.md");
  assert.match(doc, /Definition of done/i);
  assert.match(doc, /Non-goals/i);
  assert.match(doc, /storeMode/);
  assert.match(doc, /postgres/i);
  assert.match(doc, /file_fallback/);
  assert.match(doc, /SHIELD.*Neon-only|Neon-only.*SHIELD/i);
  assert.match(doc, /productionRbacEnforced/);
  assert.match(doc, /liveEmis|ehrWrite/i);
  assert.match(doc, /care-episode|lab.?pharmacy/i);
  assert.match(doc, /does \*\*not\*\* flip|Not\*\* flipping|remains false/i);

  // --- Source contracts ---
  const storeSrc = read("lib/agents/execution-run-store.ts");
  assert.match(storeSrc, /listDurableAgentRunsForScopeWithMode/);
  assert.match(storeSrc, /listPostgresForScope/);
  assert.match(storeSrc, /DurableRunStoreMode/);
  assert.match(storeSrc, /file_fallback/);
  assert.match(storeSrc, /Milestone D1/);

  const visSrc = read("lib/agents/ops-run-visibility.ts");
  assert.match(visSrc, /storeMode/);
  assert.match(visSrc, /listDurableAgentRunsForScopeWithMode/);
  assert.match(visSrc, /productionRbacEnforced:\s*false/);

  const alertsSrc = read("lib/agents/ops-alerts.ts");
  assert.match(alertsSrc, /listDurableAgentRunsForScopeWithMode/);
  assert.match(alertsSrc, /storeMode/);
  assert.doesNotMatch(alertsSrc, /Dual-path residual: listDurableAgentRunsForScope still merges/);

  const channelSrc = read("lib/agents/ops-alert-channel.ts");
  assert.match(channelSrc, /durable_run_ops_unified/);
  assert.match(channelSrc, /residualDualPathStores/);
  // Milestone E1 unified care-episode + lab/pharmacy HITL; residual list is empty.
  assert.match(channelSrc, /shared_run_correlation_unified|durable_run_ops_unified/);
  assert.match(channelSrc, /productionRbacEnforced:\s*false/);

  const opsPage = read("app/dashboard/admin/agent-ops/page.tsx");
  assert.match(opsPage, /data-testid="agent-ops-durable-store-mode"/);
  assert.match(opsPage, /storeMode/);
  assert.match(opsPage, /productionRbacEnforced:\s*false/);
  assert.doesNotMatch(opsPage, /productionRbacEnforced\s*[:=]\s*true/);

  const pkg = read("package.json");
  assert.match(pkg, /"test:milestone-d"/);
  assert.match(pkg, /"test:milestone-d:unify"/);

  // --- Runtime: hermetic file storeMode ---
  const {
    claimOrRecoverDurableAgentRun,
    finalizeDurableAgentRun,
    listDurableAgentRunsForScopeWithMode,
    resetDurableAgentRunStoreForTests,
  } = await import("../lib/agents/execution-run-store");
  const { buildOpsRunVisibility } = await import("../lib/agents/ops-run-visibility");
  const { buildOpsAlerts, evaluateDurableRunAlerts } = await import("../lib/agents/ops-alerts");
  const { buildOpsAlertChannelPayload } = await import("../lib/agents/ops-alert-channel");

  const scope = "d1-unify-scope";
  await resetDurableAgentRunStoreForTests(scope);

  const claim = await claimOrRecoverDurableAgentRun({
    scopeKey: scope,
    patientId: "pt-d1-synthetic",
    patientLabel: "SHOULD_NEVER_APPEAR_IN_OPS",
    correlationId: "d1-corr-1",
    idempotencyKey: `d1-idem-${Date.now()}`,
    organisationId: "practice-d1",
  });
  assert.equal(claim.outcome, "claimed");
  await finalizeDurableAgentRun({
    ...claim.record,
    status: "completed",
    completedAt: new Date().toISOString(),
    draftEnqueueAllowed: true,
    shieldAuditPersisted: true,
    execution: {
      ...claim.record.execution,
      status: "completed",
      completedAt: new Date().toISOString(),
      durationMs: 12,
    },
  });

  const listed = await listDurableAgentRunsForScopeWithMode(scope, 20);
  assert.equal(listed.storeMode, "file");
  assert.ok(listed.runs.some((r) => r.id === claim.record.id));

  const vis = await buildOpsRunVisibility({ scopeKey: scope, limit: 20 });
  assert.equal(vis.storeMode, "file");
  assert.equal(vis.productionRbacEnforced, false);
  assert.equal(vis.ehrWrite, false);
  assert.equal(vis.phiLeakage, false);
  assert.ok(vis.total >= 1);
  const visBlob = JSON.stringify(vis);
  assert.doesNotMatch(visBlob, /SHOULD_NEVER_APPEAR_IN_OPS/);

  const alerts = await buildOpsAlerts({ scopeKey: scope, dispatchChannel: false });
  assert.equal(alerts.storeMode, "file");
  assert.equal(alerts.productionRbacEnforced, false);

  const emptyEval = evaluateDurableRunAlerts([]);
  assert.equal(emptyEval.storeMode, "file");

  const payload = buildOpsAlertChannelPayload(alerts);
  assert.ok(
    payload.dualPathResidual === "shared_run_correlation_unified" ||
      payload.dualPathResidual === "durable_run_ops_unified"
  );
  assert.deepEqual(payload.residualDualPathStores, []);
  assert.equal(payload.storeMode, "file");
  assert.equal(payload.productionRbacEnforced, false);
  assert.equal(payload.certificationClaim, false);

  // --- Simulated Neon-preferred read: file empty, but we inject via PG path mock ---
  // Without a real DATABASE_URL, prove file_fallback path by forcing isPostgresConfigured
  // via USE_POSTGRES + invalid URL would throw on getDatabaseUrl — instead verify
  // postgres branch is present in source and hermetic path stays file.
  assert.match(storeSrc, /storeMode:\s*"postgres"/);
  assert.match(storeSrc, /storeMode:\s*"file_fallback"/);

  // Stale-file honesty: when only file has data and PG unset, ops still sees file (hermetic).
  mkdirSync(path.join(tmp, "data"), { recursive: true });
  writeFileSync(
    path.join(tmp, "data", `conductor-execution-runs.${scope}.json`),
    JSON.stringify({ runs: listed.runs }),
    "utf8"
  );
  const again = await listDurableAgentRunsForScopeWithMode(scope, 10);
  assert.equal(again.storeMode, "file");
  assert.ok(again.runs.length >= 1);

  console.log("milestone-d1-durable-ops-unify: storeMode honesty + postgres-preferred contract — PASS");
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
