/**
 * Milestone A3 — stakeholder / ops visibility for durable CONDUCTOR runs.
 *
 * Surfaces status + SHIELD-blocked enqueue signals without PHI leakage.
 * Patient labels are never returned; patientId is truncated/hashed for ops.
 */
import { createHash } from "crypto";

import type { DurableAgentRunRecord, DurableAgentRunStatus } from "./execution-run-store";
import { listDurableAgentRunsForScope } from "./execution-run-store";

export type OpsRunVisibilityRow = {
  runId: string;
  correlationId: string;
  careEpisodeId: string | null;
  status: DurableAgentRunStatus;
  source: DurableAgentRunRecord["source"];
  /** Truncated patient ref — never full label / NHS number. */
  patientRef: string;
  organisationId: string | null;
  guardianOutcome: string | null;
  reviewStatus: string | null;
  draftEnqueueAllowed: boolean;
  shieldAuditPersisted: boolean;
  /** True when Guardian would allow enqueue but SHIELD gate blocked it. */
  shieldBlockedEnqueue: boolean;
  agentsInvokedCount: number;
  startedAt: string;
  completedAt: string | null;
  synthetic: true;
  ehrWrite: false;
  phiLeakage: false;
};

export type OpsRunVisibilitySummary = {
  scopeKey: string;
  total: number;
  byStatus: Record<string, number>;
  shieldBlockedCount: number;
  runningCount: number;
  failedOrTimedOutCount: number;
  rows: OpsRunVisibilityRow[];
  note: string;
  synthetic: true;
  ehrWrite: false;
  phiLeakage: false;
};

export function patientRefForOps(patientId: string): string {
  const id = patientId.trim() || "unknown";
  const digest = createHash("sha256").update(id).digest("hex").slice(0, 8);
  return `pt_${digest}`;
}

export function toOpsRunVisibilityRow(run: DurableAgentRunRecord): OpsRunVisibilityRow {
  const shieldBlockedEnqueue =
    !run.draftEnqueueAllowed &&
    run.shieldAuditPersisted === false &&
    (run.status === "blocked" ||
      run.status === "failed" ||
      run.reviewStatus === "blocked_from_queue" ||
      Boolean(run.guardianOutcome === "PASS" || run.guardianOutcome === "REVIEW"));

  // Prefer explicit execution error / note when present (errorCode union is narrow).
  const errorCode = run.execution?.errorCode != null ? String(run.execution.errorCode) : "";
  const execBlocked =
    errorCode === "SHIELD_UNAVAILABLE" || run.note?.toLowerCase().includes("shield") === true;

  return {
    runId: run.id,
    correlationId: run.correlationId,
    careEpisodeId: run.careEpisodeId,
    status: run.status,
    source: run.source,
    patientRef: patientRefForOps(run.patientId),
    organisationId: run.organisationId,
    guardianOutcome: run.guardianOutcome,
    reviewStatus: run.reviewStatus,
    draftEnqueueAllowed: run.draftEnqueueAllowed,
    shieldAuditPersisted: run.shieldAuditPersisted,
    shieldBlockedEnqueue: Boolean(shieldBlockedEnqueue || execBlocked) && !run.draftEnqueueAllowed,
    agentsInvokedCount: run.agentsInvoked?.length ?? 0,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    synthetic: true,
    ehrWrite: false,
    phiLeakage: false,
  };
}

export function summariseOpsRuns(
  runs: DurableAgentRunRecord[],
  scopeKey: string
): OpsRunVisibilitySummary {
  const rows = runs.map(toOpsRunVisibilityRow);
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  return {
    scopeKey,
    total: rows.length,
    byStatus,
    shieldBlockedCount: rows.filter((r) => r.shieldBlockedEnqueue).length,
    runningCount: rows.filter((r) => r.status === "running").length,
    failedOrTimedOutCount: rows.filter((r) => r.status === "failed" || r.status === "timed_out").length,
    rows,
    note:
      "Aggregates only — no patient names, NHS numbers, or clinical content. SHIELD-blocked enqueue is fail-closed ops signal.",
    synthetic: true,
    ehrWrite: false,
    phiLeakage: false,
  };
}

export async function buildOpsRunVisibility(input: {
  scopeKey: string;
  limit?: number;
  organisationId?: string | null;
}): Promise<OpsRunVisibilitySummary> {
  const limit = Math.min(Math.max(input.limit ?? 40, 1), 100);
  let runs = await listDurableAgentRunsForScope(input.scopeKey, limit * 2);
  if (input.organisationId) {
    runs = runs.filter(
      (r) => !r.organisationId || r.organisationId === input.organisationId
    );
  }
  return summariseOpsRuns(runs.slice(0, limit), input.scopeKey);
}
