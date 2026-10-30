/**
 * Milestone A2 — CONDUCTOR failure scenarios + durable idempotent recovery.
 * File-backed agent_intel_runs store (no second registry). SHIELD enqueue gate.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { AgentRuntimeError, resetRuntimeIdempotencyForTests } from "../lib/agents/execution-metadata";
import {
  findDurableAgentRunByIdempotencyKey,
  resetDurableAgentRunStoreForTests,
} from "../lib/agents/execution-run-store";
import {
  durableShieldRequiredForEnqueue,
  resolveShieldAwareEnqueue,
} from "../lib/agents/shield-orchestration-gate";
import { runAgentOrchestration } from "../lib/clinical-proof/agent-orchestration";
import { runClinicalSpineOrchestrate } from "../lib/clinical-spine/orchestrate";

const LLM_OFF = {
  ENABLE_LLM_SYNTHESIS: "false",
  ENABLE_LLM_GUARDIAN: "false",
  ENABLE_LLM_ORACLE: "false",
  ENABLE_LLM_DR_ASSIST: "false",
  ENABLE_LLM_NEXUS: "false",
} as const;

async function run() {
  for (const [k, v] of Object.entries(LLM_OFF)) process.env[k] = v;
  process.env.AKSH_ORCH_FAULT_INJECTION = "true";
  // Ensure SHIELD gate uses file-mode semantics for unit tests unless overridden.
  delete process.env.DATABASE_URL;
  delete process.env.USE_POSTGRES;

  const scopeKey = `a2-test-${randomUUID().slice(0, 8)}`;
  await resetDurableAgentRunStoreForTests(scopeKey);
  resetRuntimeIdempotencyForTests();

  // --- SHIELD gate unit ---
  {
    assert.equal(durableShieldRequiredForEnqueue(), false);

    const ok = resolveShieldAwareEnqueue({
      guardianAllowsEnqueue: true,
      shieldPersisted: false,
      durableRequired: false,
    });
    assert.equal(ok.draftEnqueueAllowed, true);
    assert.equal(ok.shieldBlockedEnqueue, false);

    const blocked = resolveShieldAwareEnqueue({
      guardianAllowsEnqueue: true,
      shieldPersisted: false,
      durableRequired: true,
    });
    assert.equal(blocked.draftEnqueueAllowed, false);
    assert.equal(blocked.shieldBlockedEnqueue, true);
    assert.equal(blocked.reason, "shield_unavailable");

    const guardian = resolveShieldAwareEnqueue({
      guardianAllowsEnqueue: false,
      shieldPersisted: true,
      durableRequired: true,
    });
    assert.equal(guardian.draftEnqueueAllowed, false);
    assert.equal(guardian.reason, "guardian_block");
  }

  // --- Soft-fail optional NEXUS (partial) ---
  {
    resetRuntimeIdempotencyForTests();
    const partial = await runAgentOrchestration({
      patientId: "P002",
      includeDrAssist: false,
      includeNexus: true,
      softFailOptionalAgents: true,
      faultInject: { NEXUS: "throw" },
      agentTimeoutMs: 5_000,
      overallTimeoutMs: 20_000,
      correlationId: `a2-partial-${randomUUID().slice(0, 8)}`,
    });
    assert.equal(partial.execution.status, "partial");
    assert.ok(partial.outputs.SYNTHESIS);
    assert.ok(partial.outputs.GUARDIAN);
    assert.ok(partial.outputs.ORACLE);
    assert.equal(partial.outputs.NEXUS, undefined);
    assert.equal(partial.agentMetadata.NEXUS?.status, "failed");
    assert.equal(partial.ehrWrite, false);
  }

  // --- Required agent timeout fail-closed ---
  {
    resetRuntimeIdempotencyForTests();
    await assert.rejects(
      () =>
        runAgentOrchestration({
          patientId: "P002",
          includeDrAssist: false,
          includeNexus: false,
          softFailOptionalAgents: true,
          faultInject: { SYNTHESIS: "timeout" },
          agentTimeoutMs: 50,
          overallTimeoutMs: 5_000,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AgentRuntimeError);
        assert.equal(err.classification.code, "TIMEOUT");
        assert.equal(err.classification.retryable, false);
        return true;
      }
    );
  }

  // --- Durable claim + idempotent recovery ---
  {
    resetRuntimeIdempotencyForTests();
    const key = `a2-idem-${randomUUID()}`;
    const first = await runClinicalSpineOrchestrate({
      patientId: "P002",
      includeDrAssist: false,
      includeTwinRanking: false,
      includeNexus: true,
      scopeKey,
      careEpisodeId: "ce-a2-idem",
      correlationId: `a2-corr-${randomUUID().slice(0, 8)}`,
      idempotencyKey: key,
    });
    assert.equal(first.durableRecovered, false);
    assert.ok(first.durableRunId);
    assert.equal(first.ehrWrite, false);
    assert.equal(first.hitlRequired, true);
    assert.equal(typeof first.shieldBlockedEnqueue, "boolean");
    assert.equal(first.shieldBlockedEnqueue, false); // no Postgres → shield not required
    assert.ok(first.draftEnqueueAllowed || first.guardianGateway?.output_status === "BLOCK");

    const stored = await findDurableAgentRunByIdempotencyKey(key, scopeKey);
    assert.ok(stored);
    assert.notEqual(stored!.status, "running");
    assert.ok(stored!.resultSnapshot);
    assert.equal(stored!.careEpisodeId, "ce-a2-idem");
    assert.equal(stored!.source, "clinical_spine");

    resetRuntimeIdempotencyForTests();
    const second = await runClinicalSpineOrchestrate({
      patientId: "P002",
      includeDrAssist: false,
      includeTwinRanking: false,
      scopeKey,
      careEpisodeId: "ce-a2-idem",
      correlationId: `a2-corr-retry-${randomUUID().slice(0, 8)}`,
      idempotencyKey: key,
    });
    assert.equal(second.durableRecovered, true);
    assert.equal(second.durableRunId, first.durableRunId);
    assert.equal(second.correlationId, first.correlationId);
    assert.equal(second.orchestration.execution.correlationId, first.orchestration.execution.correlationId);
    assert.equal(second.safetyRoute, first.safetyRoute);
  }

  // --- Durable failure recovery (re-throws same classified error) ---
  {
    resetRuntimeIdempotencyForTests();
    const key = `a2-fail-${randomUUID()}`;
    await assert.rejects(
      () =>
        runClinicalSpineOrchestrate({
          patientId: "P002",
          includeDrAssist: false,
          includeTwinRanking: false,
          includeNexus: false,
          scopeKey,
          idempotencyKey: key,
          faultInject: { GUARDIAN: "timeout" },
          agentTimeoutMs: 50,
          overallTimeoutMs: 5_000,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AgentRuntimeError);
        assert.equal(err.classification.code, "TIMEOUT");
        return true;
      }
    );

    const failed = await findDurableAgentRunByIdempotencyKey(key, scopeKey);
    assert.ok(failed);
    assert.equal(failed!.status, "timed_out");
    assert.equal(failed!.draftEnqueueAllowed, false);

    resetRuntimeIdempotencyForTests();
    await assert.rejects(
      () =>
        runClinicalSpineOrchestrate({
          patientId: "P002",
          includeDrAssist: false,
          includeTwinRanking: false,
          scopeKey,
          idempotencyKey: key,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AgentRuntimeError);
        assert.equal(err.classification.code, "TIMEOUT");
        return true;
      }
    );
  }

  // --- Stale running reclaim then complete ---
  {
    resetRuntimeIdempotencyForTests();
    const key = `a2-reclaim-${randomUUID()}`;
    const { claimOrRecoverDurableAgentRun, finalizeDurableAgentRun } = await import(
      "../lib/agents/execution-run-store"
    );
    const claim = await claimOrRecoverDurableAgentRun({
      scopeKey,
      patientId: "P002",
      patientLabel: "Test",
      correlationId: "corr-reclaim",
      idempotencyKey: key,
    });
    assert.equal(claim.outcome, "claimed");
    assert.equal(claim.record.status, "running");

    const reclaim = await claimOrRecoverDurableAgentRun({
      scopeKey,
      patientId: "P002",
      patientLabel: "Test",
      correlationId: "corr-reclaim-2",
      idempotencyKey: key,
    });
    assert.equal(reclaim.outcome, "claimed");
    assert.equal(reclaim.record.id, claim.record.id);

    await finalizeDurableAgentRun({
      ...reclaim.record,
      status: "completed",
      completedAt: new Date().toISOString(),
      resultSnapshot: {
        artifactType: "aksh-clinical-spine-orchestrate",
        orchestration: { execution: { correlationId: "corr-reclaim" } },
        correlationId: "corr-reclaim",
        careEpisodeId: null,
        draftEnqueueAllowed: true,
        runAuditRecorded: false,
        shieldBlockedEnqueue: false,
        durableRunId: reclaim.record.id,
        durableRecovered: false,
        ehrWrite: false,
        hitlRequired: true,
        physiologicalTwin: false,
        autoRetrain: false,
        liveEmis: false,
        note: "fixture",
        safetyRoute: "low_risk_coaching",
        safetyRouteLabel: "fixture",
        twin: null,
        modelCard: {} as never,
        diabetesModuleEnabled: false,
        diabetes: null,
        diabetesEscalation: "none",
      } as unknown as Record<string, unknown>,
      note: "reclaim fixture",
    });

    const recovered = await claimOrRecoverDurableAgentRun({
      scopeKey,
      patientId: "P002",
      patientLabel: "Test",
      correlationId: "corr-done",
      idempotencyKey: key,
    });
    assert.equal(recovered.outcome, "recovered");
    assert.equal(recovered.record.status, "completed");
  }

  delete process.env.AKSH_ORCH_FAULT_INJECTION;
  console.log("orchestration-reliability-a2: SHIELD gate, soft-fail, timeout, durable recovery — PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
