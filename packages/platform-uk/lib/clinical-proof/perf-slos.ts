/**
 * Performance SLO targets for clinical-proof / Gate prep.
 * Sourced from E2E clinical proof plan — smoke checks, not full load tests.
 *
 * Soft by default: CI should not hard-fail on cold serverless / shared CI latency.
 * Set PERF_SMOKE_STRICT=true to treat threshold misses as failures when the target is reachable.
 */

export type PerfSloId = "dashboard_load" | "agent_draft" | "review_action";

export type PerfSloTarget = {
  id: PerfSloId;
  label: string;
  /** Soft target (ms) — warn / soft-fail above this */
  targetMs: number;
  /** Hard ceiling (ms) — only enforced when PERF_SMOKE_STRICT=true */
  hardMs: number;
  howMeasured: string;
  evidenceArtefact: string;
};

export const PERF_SLO_TARGETS: PerfSloTarget[] = [
  {
    id: "dashboard_load",
    label: "GP / role dashboard TTFB (HTML)",
    targetMs: 3_000,
    hardMs: 8_000,
    howMeasured: "GET /dashboard/gp (or public allowlisted dashboard) — server response time",
    evidenceArtefact: "docs/evidence-pack/09-performance-load.md"
  },
  {
    id: "agent_draft",
    label: "Agent draft API (deterministic / LLM-off)",
    targetMs: 5_000,
    hardMs: 15_000,
    howMeasured: "POST /api/agents/guardian with ENABLE_LLM_*=false — draft JSON only",
    evidenceArtefact: "docs/evidence-pack/09-performance-load.md"
  },
  {
    id: "review_action",
    label: "Review action path (HITL accept→stage contract)",
    targetMs: 2_000,
    hardMs: 6_000,
    howMeasured: "In-process HITL chain unit timing or authenticated review PUT when available",
    evidenceArtefact: "docs/evidence-pack/09-performance-load.md"
  }
];

export function getPerfSlo(id: PerfSloId): PerfSloTarget {
  const found = PERF_SLO_TARGETS.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown perf SLO: ${id}`);
  return found;
}

export function evaluatePerfSample(options: {
  id: PerfSloId;
  elapsedMs: number;
  strict?: boolean;
}): { ok: boolean; soft: boolean; message: string } {
  const target = getPerfSlo(options.id);
  const strict = options.strict ?? process.env.PERF_SMOKE_STRICT === "true";

  if (options.elapsedMs <= target.targetMs) {
    return {
      ok: true,
      soft: false,
      message: `${target.id} ${options.elapsedMs}ms ≤ target ${target.targetMs}ms`
    };
  }

  if (options.elapsedMs <= target.hardMs) {
    return {
      ok: !strict,
      soft: true,
      message: `${target.id} ${options.elapsedMs}ms above soft target ${target.targetMs}ms (≤ hard ${target.hardMs}ms)`
    };
  }

  return {
    ok: !strict,
    soft: true,
    message: `${target.id} ${options.elapsedMs}ms above hard ${target.hardMs}ms${strict ? " (STRICT fail)" : " (soft-fail — env may not hit prod latency)"}`
  };
}
