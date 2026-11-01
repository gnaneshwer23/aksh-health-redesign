/**
 * Milestone A4 — actionable Agent Ops alert signals from persisted durable runs
 * (+ optional care-episode open-task age). No PHI; no second monitoring product.
 * Milestone C4 — optional webhook channel via `dispatchOpsAlertChannel` (default off).
 */
import type { CareEpisode } from "../care-episode/types";
import { dispatchOpsAlertChannel } from "./ops-alert-channel";
import type { DurableAgentRunRecord } from "./execution-run-store";
import { listDurableAgentRunsForScope } from "./execution-run-store";
import { patientRefForOps, toOpsRunVisibilityRow } from "./ops-run-visibility";

export type OpsAlertSeverity = "info" | "warning" | "critical";

export type OpsAlertSignal = {
  id: string;
  code:
    | "REPEATED_AGENT_FAILURES"
    | "SHIELD_BLOCK_RATE_HIGH"
    | "STUCK_DURABLE_RUNS"
    | "STUCK_CARE_EPISODE_TASKS";
  severity: OpsAlertSeverity;
  title: string;
  detail: string;
  count: number;
  /** Opaque refs only — never patient labels. */
  sampleRefs: string[];
  windowMinutes: number;
  threshold: number;
  observedAt: string;
  actionable: true;
  phiLeakage: false;
  synthetic: true;
};

export type OpsAlertsSummary = {
  scopeKey: string;
  generatedAt: string;
  alerts: OpsAlertSignal[];
  metrics: {
    sampleSize: number;
    failedOrTimedOut: number;
    shieldBlocked: number;
    shieldBlockRate: number | null;
    stuckRunning: number;
    stuckEpisodeTasks: number;
  };
  note: string;
  phiLeakage: false;
  synthetic: true;
  ehrWrite: false;
};

export const OPS_ALERT_DEFAULTS = {
  /** Lookback for repeated failures / block rates. */
  windowMinutes: 60,
  /** Failures in window that raise REPEATED_AGENT_FAILURES. */
  repeatedFailureThreshold: 3,
  /** SHIELD-blocked share of sampled runs that raises warning (≥3 samples). */
  shieldBlockRateThreshold: 0.35,
  /** Running longer than this is "stuck" (A2 reclaim window visibility). */
  stuckRunningMinutes: 15,
  /** Open care-episode tasks older than this raise stuck-episode alert. */
  stuckEpisodeTaskHours: 24,
} as const;

function minutesAgoIso(minutes: number, now: Date): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

export function evaluateDurableRunAlerts(
  runs: DurableAgentRunRecord[],
  options?: {
    now?: Date;
    windowMinutes?: number;
    repeatedFailureThreshold?: number;
    shieldBlockRateThreshold?: number;
    stuckRunningMinutes?: number;
    episodes?: CareEpisode[];
    stuckEpisodeTaskHours?: number;
  }
): OpsAlertsSummary {
  const now = options?.now ?? new Date();
  const windowMinutes = options?.windowMinutes ?? OPS_ALERT_DEFAULTS.windowMinutes;
  const failureThreshold =
    options?.repeatedFailureThreshold ?? OPS_ALERT_DEFAULTS.repeatedFailureThreshold;
  const shieldRateThreshold =
    options?.shieldBlockRateThreshold ?? OPS_ALERT_DEFAULTS.shieldBlockRateThreshold;
  const stuckRunningMinutes =
    options?.stuckRunningMinutes ?? OPS_ALERT_DEFAULTS.stuckRunningMinutes;
  const stuckEpisodeTaskHours =
    options?.stuckEpisodeTaskHours ?? OPS_ALERT_DEFAULTS.stuckEpisodeTaskHours;

  const windowStart = minutesAgoIso(windowMinutes, now);
  const windowRuns = runs.filter((r) => r.startedAt >= windowStart);
  const rows = windowRuns.map(toOpsRunVisibilityRow);

  const failed = windowRuns.filter(
    (r) => r.status === "failed" || r.status === "timed_out"
  );
  const shieldBlocked = rows.filter((r) => r.shieldBlockedEnqueue);
  const stuckCutoff = minutesAgoIso(stuckRunningMinutes, now);
  const stuckRunning = runs.filter(
    (r) => r.status === "running" && r.startedAt <= stuckCutoff
  );

  const alerts: OpsAlertSignal[] = [];
  const observedAt = now.toISOString();

  if (failed.length >= failureThreshold) {
    alerts.push({
      id: `alert-repeated-failures-${windowMinutes}m`,
      code: "REPEATED_AGENT_FAILURES",
      severity: failed.length >= failureThreshold * 2 ? "critical" : "warning",
      title: "Repeated durable agent failures",
      detail: `${failed.length} failed/timed_out CONDUCTOR runs in the last ${windowMinutes}m (threshold ${failureThreshold}).`,
      count: failed.length,
      sampleRefs: failed.slice(0, 5).map((r) => patientRefForOps(r.patientId)),
      windowMinutes,
      threshold: failureThreshold,
      observedAt,
      actionable: true,
      phiLeakage: false,
      synthetic: true,
    });
  }

  const sampleSize = windowRuns.length;
  const shieldBlockRate = sampleSize >= 3 ? shieldBlocked.length / sampleSize : null;
  if (shieldBlockRate != null && shieldBlockRate >= shieldRateThreshold) {
    alerts.push({
      id: `alert-shield-block-rate-${windowMinutes}m`,
      code: "SHIELD_BLOCK_RATE_HIGH",
      severity: shieldBlockRate >= 0.6 ? "critical" : "warning",
      title: "Elevated SHIELD enqueue block rate",
      detail: `${Math.round(shieldBlockRate * 100)}% of ${sampleSize} durable runs blocked from enqueue (threshold ${Math.round(shieldRateThreshold * 100)}%). Fail-closed — investigate SHIELD/Postgres availability.`,
      count: shieldBlocked.length,
      sampleRefs: shieldBlocked.slice(0, 5).map((r) => r.patientRef),
      windowMinutes,
      threshold: shieldRateThreshold,
      observedAt,
      actionable: true,
      phiLeakage: false,
      synthetic: true,
    });
  }

  if (stuckRunning.length > 0) {
    alerts.push({
      id: `alert-stuck-running-${stuckRunningMinutes}m`,
      code: "STUCK_DURABLE_RUNS",
      severity: stuckRunning.length >= 3 ? "critical" : "warning",
      title: "Stuck durable CONDUCTOR runs",
      detail: `${stuckRunning.length} run(s) still status=running after ${stuckRunningMinutes}m (A2 reclaim window). Check worker health / finalize path.`,
      count: stuckRunning.length,
      sampleRefs: stuckRunning.slice(0, 5).map((r) => patientRefForOps(r.patientId)),
      windowMinutes: stuckRunningMinutes,
      threshold: 1,
      observedAt,
      actionable: true,
      phiLeakage: false,
      synthetic: true,
    });
  }

  let stuckEpisodeTasks = 0;
  const episodeSampleRefs: string[] = [];
  const episodeCutoffMs = stuckEpisodeTaskHours * 60 * 60 * 1000;
  for (const ep of options?.episodes ?? []) {
    if (ep.status === "closed" || ep.status === "cancelled") continue;
    for (const task of ep.tasks ?? []) {
      if (task.status !== "open") continue;
      const ageMs = now.getTime() - new Date(task.createdAt).getTime();
      if (ageMs >= episodeCutoffMs) {
        stuckEpisodeTasks += 1;
        if (episodeSampleRefs.length < 5) {
          episodeSampleRefs.push(patientRefForOps(ep.patientId));
        }
      }
    }
  }
  if (stuckEpisodeTasks > 0) {
    alerts.push({
      id: `alert-stuck-episodes-${stuckEpisodeTaskHours}h`,
      code: "STUCK_CARE_EPISODE_TASKS",
      severity: stuckEpisodeTasks >= 5 ? "critical" : "warning",
      title: "Stuck care-episode stakeholder tasks",
      detail: `${stuckEpisodeTasks} open task(s) older than ${stuckEpisodeTaskHours}h. Review handoffs / assignment ownership.`,
      count: stuckEpisodeTasks,
      sampleRefs: episodeSampleRefs,
      windowMinutes: stuckEpisodeTaskHours * 60,
      threshold: 1,
      observedAt,
      actionable: true,
      phiLeakage: false,
      synthetic: true,
    });
  }

  return {
    scopeKey: "",
    generatedAt: observedAt,
    alerts,
    metrics: {
      sampleSize,
      failedOrTimedOut: failed.length,
      shieldBlocked: shieldBlocked.length,
      shieldBlockRate,
      stuckRunning: stuckRunning.length,
      stuckEpisodeTasks,
    },
    note: "Alert signals from persisted durable runs / care-episode tasks only. No patient names, NHS numbers, or clinical content.",
    phiLeakage: false,
    synthetic: true,
    ehrWrite: false,
  };
}

export async function buildOpsAlerts(input: {
  scopeKey: string;
  limit?: number;
  episodes?: CareEpisode[];
  now?: Date;
  /** When true (default), attempt optional C4 webhook if env-enabled. */
  dispatchChannel?: boolean;
}): Promise<OpsAlertsSummary> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 200);
  // Dual-path residual: listDurableAgentRunsForScope still merges file mirror vs Neon.
  const runs = await listDurableAgentRunsForScope(input.scopeKey, limit);
  const summary = evaluateDurableRunAlerts(runs, {
    now: input.now,
    episodes: input.episodes,
  });
  const withScope = { ...summary, scopeKey: input.scopeKey };
  if (input.dispatchChannel !== false) {
    void dispatchOpsAlertChannel(withScope).catch(() => {
      /* never surface channel faults to Agent Ops readers */
    });
  }
  return withScope;
}
