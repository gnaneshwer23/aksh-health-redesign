/**
 * Milestone A4 — authz matrix, cross-tenant denial, PHI-safe refs,
 * durable-run alert signals, rate-limit guard wiring.
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const tmp = mkdtempSync(path.join(tmpdir(), "a4-security-"));
const prevCwd = process.cwd();
const prevDbUrl = process.env.DATABASE_URL;
const prevUsePg = process.env.USE_POSTGRES;
delete process.env.DATABASE_URL;
delete process.env.USE_POSTGRES;
process.chdir(tmp);

async function main() {
  const root = path.join(__dirname, "..");

  const {
    evaluateAgentAuthz,
    evaluateScopeIsolation,
    AGENT_INVOKE_ROLES,
    AGENT_OPS_ROLES,
  } = await import("../lib/security/agent-authz");
  const {
    phiSafePatientRef,
    phiSafeResourceRef,
    minimisePhiInText,
  } = await import("../lib/security/phi-safe-ref");
  const { buildRolePermissionMatrix } = await import("../lib/permission-matrix");
  const {
    claimOrRecoverDurableAgentRun,
    finalizeDurableAgentRun,
    resetDurableAgentRunStoreForTests,
  } = await import("../lib/agents/execution-run-store");
  const { evaluateDurableRunAlerts, buildOpsAlerts } = await import(
    "../lib/agents/ops-alerts"
  );
  const { buildOpsRunVisibility } = await import("../lib/agents/ops-run-visibility");
  const {
    createCareEpisode,
    addCareEpisodeTask,
    resetCareEpisodeStoreForTests,
    listCareEpisodesForScope,
  } = await import("../lib/care-episode");
  const { assertRuntimeScope, AgentRuntimeError } = await import(
    "../lib/agents/execution-metadata"
  );

  // --- Authz matrix / role denials ---
  {
    assert.equal(evaluateAgentAuthz({ action: "agent_invoke", role: "clinical_reviewer" }).allowed, true);
    assert.equal(evaluateAgentAuthz({ action: "agent_invoke", role: "patient" }).allowed, false);
    assert.equal(evaluateAgentAuthz({ action: "agent_invoke", role: "researcher" }).allowed, false);
    assert.equal(evaluateAgentAuthz({ action: "agent_invoke", role: "operations_lead" }).allowed, false);
    assert.equal(evaluateAgentAuthz({ action: "agent_ops_inspect", role: "operations_lead" }).allowed, true);
    assert.equal(evaluateAgentAuthz({ action: "agent_ops_inspect", role: "patient" }).allowed, false);
    assert.equal(evaluateAgentAuthz({ action: "review_queue_mutate", role: "researcher" }).allowed, false);
    assert.equal(evaluateAgentAuthz({ action: "capture_reviewer_decision", role: "patient" }).allowed, false);
    assert.ok(AGENT_INVOKE_ROLES.includes("clinical_reviewer"));
    assert.ok(AGENT_OPS_ROLES.includes("operations_lead"));

    const matrix = buildRolePermissionMatrix();
    const agentInvoke = matrix.matrix.find((r) => r.actionId === "agent_invoke");
    assert.ok(agentInvoke);
    assert.equal(agentInvoke!.patient, "denied");
    assert.equal(agentInvoke!.researcher, "denied");
    assert.equal(agentInvoke!.clinical_reviewer, "allowed");
    const ops = matrix.matrix.find((r) => r.actionId === "agent_ops_inspect");
    assert.equal(ops!.operations_lead, "allowed");
    assert.equal(ops!.patient, "denied");
  }

  // --- Cross-tenant scope isolation ---
  {
    assert.equal(
      evaluateScopeIsolation({
        requestScopeKey: "tenant-a",
        resourceScopeKey: "tenant-b",
      }).allowed,
      false
    );
    assert.match(
      evaluateScopeIsolation({
        requestScopeKey: "tenant-a",
        resourceScopeKey: "tenant-b",
      }).reason,
      /CROSS_TENANT/
    );
    assert.equal(
      evaluateScopeIsolation({
        requestScopeKey: "tenant-a",
        resourceScopeKey: "tenant-a",
      }).allowed,
      true
    );

    try {
      assertRuntimeScope({
        requestScopeKey: "scope-a",
        expectedScopeKey: "scope-b",
        patientId: "P002-Sensitive-Name",
      });
      assert.fail("expected CROSS_TENANT");
    } catch (err) {
      assert.ok(err instanceof AgentRuntimeError);
      assert.equal(err.classification.code, "CROSS_TENANT");
      assert.doesNotMatch(err.message, /P002-Sensitive-Name/);
    }
  }

  // --- PHI-safe refs ---
  {
    const ref = phiSafePatientRef("Alice Example / NHS 123 456 7890");
    assert.match(ref, /^pt_[a-f0-9]{8}$/);
    assert.notEqual(ref, "Alice Example / NHS 123 456 7890");
    const resource = phiSafeResourceRef("P002", { caseId: "case-1", agentLabel: "GUARDIAN" });
    assert.match(resource, /^pt_[a-f0-9]{8}:case_case-1:GUARDIAN$/);
    assert.doesNotMatch(resource, /Alice|NHS|P002/);
    const scrubbed = minimisePhiInText("Patient Jane Doe NHS 943 476 5919 status PASS");
    assert.match(scrubbed, /\[redacted/);
    assert.match(scrubbed, /PASS/);
  }

  const scopeA = `a4a-${randomUUID().slice(0, 8)}`;
  const scopeB = `a4b-${randomUUID().slice(0, 8)}`;
  await resetDurableAgentRunStoreForTests(scopeA);
  await resetDurableAgentRunStoreForTests(scopeB);
  await resetCareEpisodeStoreForTests(scopeA);

  // --- Cross-tenant durable ops visibility ---
  {
    const claimA = await claimOrRecoverDurableAgentRun({
      scopeKey: scopeA,
      patientId: "P-Tenant-A-Secret",
      patientLabel: "SHOULD_NEVER_LEAK_A",
      correlationId: `corr-a-${randomUUID().slice(0, 6)}`,
      idempotencyKey: `a4-a-${randomUUID().slice(0, 8)}`,
      organisationId: "practice-a",
    });
    assert.equal(claimA.outcome, "claimed");
    await finalizeDurableAgentRun({
      ...claimA.record,
      status: "failed",
      completedAt: new Date().toISOString(),
      draftEnqueueAllowed: false,
      shieldAuditPersisted: false,
      note: "forced failure fixture",
      execution: {
        ...claimA.record.execution,
        status: "failed",
        completedAt: new Date().toISOString(),
        durationMs: 1,
        errorCode: "INTERNAL",
        errorMessage: "fixture",
      },
    });

    const claimB = await claimOrRecoverDurableAgentRun({
      scopeKey: scopeB,
      patientId: "P-Tenant-B-Secret",
      patientLabel: "SHOULD_NEVER_LEAK_B",
      correlationId: `corr-b-${randomUUID().slice(0, 6)}`,
      idempotencyKey: `a4-b-${randomUUID().slice(0, 8)}`,
      organisationId: "practice-b",
    });
    assert.equal(claimB.outcome, "claimed");
    await finalizeDurableAgentRun({
      ...claimB.record,
      status: "completed",
      completedAt: new Date().toISOString(),
      draftEnqueueAllowed: true,
      shieldAuditPersisted: true,
      execution: {
        ...claimB.record.execution,
        status: "completed",
        completedAt: new Date().toISOString(),
        durationMs: 1,
      },
    });

    const visA = await buildOpsRunVisibility({ scopeKey: scopeA, limit: 20 });
    const visB = await buildOpsRunVisibility({ scopeKey: scopeB, limit: 20 });
    assert.ok(visA.total >= 1);
    assert.ok(visB.total >= 1);
    const blobA = JSON.stringify(visA);
    const blobB = JSON.stringify(visB);
    assert.doesNotMatch(blobA, /SHOULD_NEVER_LEAK|P-Tenant-A-Secret|P-Tenant-B-Secret/);
    assert.doesNotMatch(blobB, /SHOULD_NEVER_LEAK|P-Tenant-A-Secret|P-Tenant-B-Secret/);
    assert.equal(
      visA.rows.some((r) => r.runId === claimB.record.id),
      false,
      "scope A must not see scope B runs"
    );
    assert.equal(
      visB.rows.some((r) => r.runId === claimA.record.id),
      false,
      "scope B must not see scope A runs"
    );
  }

  // --- Durable-run alerts: repeated failures, SHIELD block rate, stuck running, stuck episodes ---
  {
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const claim = await claimOrRecoverDurableAgentRun({
        scopeKey: scopeA,
        patientId: `P-fail-${i}`,
        patientLabel: `Fail Label ${i}`,
        correlationId: `corr-fail-${i}`,
        idempotencyKey: `a4-fail-${randomUUID().slice(0, 8)}`,
      });
      await finalizeDurableAgentRun({
        ...claim.record,
        status: "failed",
        startedAt: new Date(now.getTime() - 5 * 60_000).toISOString(),
        completedAt: now.toISOString(),
        draftEnqueueAllowed: false,
        shieldAuditPersisted: false,
        guardianOutcome: "PASS",
        reviewStatus: "blocked_from_queue",
        note: "SHIELD unavailable blocked enqueue",
        execution: {
          ...claim.record.execution,
          status: "failed",
          errorCode: "SHIELD_UNAVAILABLE",
          errorMessage: "shield unavailable",
          completedAt: now.toISOString(),
          durationMs: 1,
        },
      });
    }

    const stuck = await claimOrRecoverDurableAgentRun({
      scopeKey: scopeA,
      patientId: "P-stuck",
      patientLabel: "Stuck Label",
      correlationId: "corr-stuck",
      idempotencyKey: `a4-stuck-${randomUUID().slice(0, 8)}`,
    });
    // Backdate running claim beyond stuck threshold.
    await finalizeDurableAgentRun({
      ...stuck.record,
      status: "running",
      startedAt: new Date(now.getTime() - 20 * 60_000).toISOString(),
      completedAt: null,
      execution: {
        ...stuck.record.execution,
        status: "running",
        startedAt: new Date(now.getTime() - 20 * 60_000).toISOString(),
        completedAt: null,
      },
    });

    const episode = await createCareEpisode({
      scopeKey: scopeA,
      patientId: "P-episode-stuck",
      patientLabel: "Episode Secret",
      createdBy: "a4-test",
      pathway: "diabetes",
    });
    await addCareEpisodeTask(
      episode.id,
      {
        title: "GP follow-up",
        ownerRole: "gp",
        createdAt: new Date(now.getTime() - 30 * 60 * 60_000).toISOString(),
      },
      "a4-test",
      scopeA
    );

    const episodes = await listCareEpisodesForScope(scopeA, 50);
    const alerts = await buildOpsAlerts({
      scopeKey: scopeA,
      limit: 100,
      episodes,
      now,
    });
    assert.equal(alerts.phiLeakage, false);
    assert.ok(alerts.alerts.some((a) => a.code === "REPEATED_AGENT_FAILURES"));
    assert.ok(alerts.alerts.some((a) => a.code === "SHIELD_BLOCK_RATE_HIGH"));
    assert.ok(alerts.alerts.some((a) => a.code === "STUCK_DURABLE_RUNS"));
    assert.ok(alerts.alerts.some((a) => a.code === "STUCK_CARE_EPISODE_TASKS"));
    const alertBlob = JSON.stringify(alerts);
    assert.doesNotMatch(alertBlob, /Fail Label|Stuck Label|Episode Secret|P-fail|P-stuck|P-episode/);

    const pure = evaluateDurableRunAlerts([], { now });
    assert.equal(pure.alerts.length, 0);
    assert.equal(pure.metrics.failedOrTimedOut, 0);
  }

  // --- Route / UI wiring (static contracts) ---
  {
    const opsRoute = readFileSync(path.join(root, "app/api/agents/ops-runs/route.ts"), "utf8");
    assert.match(opsRoute, /requireAppRole/);
    assert.match(opsRoute, /AGENT_OPS_ROLES/);
    assert.match(opsRoute, /enforceOpsRunsRateLimit/);
    assert.match(opsRoute, /buildOpsAlerts/);

    const orch = readFileSync(path.join(root, "app/api/agents/orchestrate/route.ts"), "utf8");
    assert.match(orch, /AGENT_INVOKE_ROLES/);
    assert.match(orch, /enforceAgentInvokeRateLimit/);

    for (const agent of ["guardian", "nexus", "synthesis", "oracle"]) {
      const src = readFileSync(path.join(root, `app/api/agents/${agent}/route.ts`), "utf8");
      assert.match(src, /requireAppRole/);
      assert.match(src, /phiSafeResourceRef/);
      assert.match(src, /enforceAgentInvokeRateLimit/);
    }

    const decision = readFileSync(
      path.join(root, "app/api/review-cases/[id]/decision/route.ts"),
      "utf8"
    );
    assert.match(decision, /REVIEW_DECISION_ROLES/);
    assert.match(decision, /enforceReviewDecisionRateLimit/);

    const assign = readFileSync(
      path.join(root, "app/api/gp/review-queue/assign/route.ts"),
      "utf8"
    );
    assert.match(assign, /REVIEW_QUEUE_MUTATE_ROLES/);
    assert.match(assign, /enforceReviewAssignRateLimit/);

    const page = readFileSync(
      path.join(root, "app/dashboard/admin/agent-ops/page.tsx"),
      "utf8"
    );
    assert.match(page, /data-testid="agent-ops-alerts"/);
    assert.match(page, /alerts=1/);
    assert.doesNotMatch(page, /patientName|NHS number|dateOfBirth/i);

    const rateGuards = readFileSync(
      path.join(root, "lib/agents/rate-limit-guards.ts"),
      "utf8"
    );
    assert.match(rateGuards, /enforceAgentInvokeRateLimit/);
    assert.match(rateGuards, /checkRateLimit/);
  }

  console.log(
    "security-observability-a4: authz, cross-tenant, PHI refs, durable alerts, route wiring — PASS"
  );
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
    rmSync(tmp, { recursive: true, force: true });
  });
