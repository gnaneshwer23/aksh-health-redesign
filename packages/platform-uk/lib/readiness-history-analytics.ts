import type { EvidenceReadinessSnapshot } from "./readiness-history-types";

export function deriveEvidenceReadinessTrend(archive: EvidenceReadinessSnapshot[]) {
  const ordered = [...archive].reverse();
  const first = ordered[0];
  const latest = ordered[ordered.length - 1];
  const previous = ordered[ordered.length - 2];
  const statusScore = {
    blocked: 0,
    needs_follow_up: 1,
    ready: 2
  };
  const latestScore = latest ? statusScore[latest.gate.status] : 0;
  const previousScore = previous ? statusScore[previous.gate.status] : latestScore;
  const firstScore = first ? statusScore[first.gate.status] : latestScore;
  const passRateDelta = latest && first ? latest.benchmarkSummary.passRate - first.benchmarkSummary.passRate : 0;
  const openActionDelta = latest && first ? latest.actionSummary.openBenchmarkActions - first.actionSummary.openBenchmarkActions : 0;
  const direction =
    archive.length < 2
      ? ("insufficient_history" as const)
      : latestScore > previousScore || passRateDelta > 0 || openActionDelta < 0
        ? ("improving" as const)
        : latestScore < previousScore || passRateDelta < 0 || openActionDelta > 0
          ? ("regressing" as const)
          : ("stable" as const);

  return {
    direction,
    snapshotCount: archive.length,
    latestStatus: latest?.gate.status ?? "no_snapshot",
    latestLabel: latest?.gate.label ?? "No snapshots saved",
    statusScoreDelta: latestScore - firstScore,
    passRateDelta,
    openActionDelta,
    latestSavedAt: latest?.savedAt ?? null,
    summary:
      direction === "insufficient_history"
        ? "Save at least two readiness snapshots to establish a trend."
        : direction === "improving"
          ? "Evidence readiness is improving across saved snapshots."
          : direction === "regressing"
            ? "Evidence readiness is regressing and needs review."
            : "Evidence readiness is stable across saved snapshots."
  };
}
