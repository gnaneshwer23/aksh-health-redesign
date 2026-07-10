import { reviewCases as seedCases } from "./mock-data";
import type { BenchmarkSignoffEntry } from "./benchmark-signoff-types";
import type { FeedbackEntry } from "./feedback-types";
import type { ReviewCase } from "./types";
import {
  deriveScenarioBenchmark,
  deriveRemediationStalledAlerts,
  deriveScenarioBenchmarkActionQueue
} from "./workflow";

export function deriveDataHealthSummary(
  cases: ReviewCase[],
  feedbackArchive: FeedbackEntry[],
  latestBenchmarkSignoff?: BenchmarkSignoffEntry
) {
  const seedIds = new Set(seedCases.map((item) => item.id));
  const presentSeedCount = cases.filter((item) => seedIds.has(item.id)).length;
  const extraCaseCount = cases.filter((item) => !seedIds.has(item.id)).length;
  const benchmarkActions = deriveScenarioBenchmarkActionQueue(cases);
  const stalledRemediation = deriveRemediationStalledAlerts(cases);
  const openFeedback = feedbackArchive.filter((entry) => entry.resolutionStatus !== "resolved");

  return {
    seedCaseCount: seedCases.length,
    presentSeedCount,
    missingSeedCount: Math.max(0, seedCases.length - presentSeedCount),
    extraCaseCount,
    openBenchmarkActions: benchmarkActions.total,
    resolvedBenchmarkActions: benchmarkActions.resolved,
    stalledRemediationActions: stalledRemediation.length,
    openFeedbackItems: openFeedback.length,
    benchmarkSignoffStatus: latestBenchmarkSignoff?.decision ?? "unsigned",
    benchmarkSignedAt: latestBenchmarkSignoff?.signedAt ?? null,
    benchmarkSignedBy: latestBenchmarkSignoff?.reviewerName ?? null,
    state:
      presentSeedCount === seedCases.length &&
      extraCaseCount === 0 &&
      benchmarkActions.total === 0 &&
      stalledRemediation.length === 0 &&
      openFeedback.length === 0 &&
      latestBenchmarkSignoff?.decision === "accepted_for_internal_evidence"
        ? ("clean_seed" as const)
        : extraCaseCount > 0 || openFeedback.length > 0
          ? ("session_modified" as const)
          : ("needs_review" as const)
  };
}

export function deriveEvidenceReadinessGate(
  cases: ReviewCase[],
  feedbackArchive: FeedbackEntry[],
  latestBenchmarkSignoff?: BenchmarkSignoffEntry
) {
  const benchmark = deriveScenarioBenchmark(cases);
  const dataHealth = deriveDataHealthSummary(cases, feedbackArchive, latestBenchmarkSignoff);
  const blockers = [
    benchmark.failed > 0 ? `${benchmark.failed} benchmark case(s) failing expected outcomes` : "",
    dataHealth.openBenchmarkActions > 0 ? `${dataHealth.openBenchmarkActions} open benchmark action(s)` : "",
    dataHealth.stalledRemediationActions > 0 ? `${dataHealth.stalledRemediationActions} stalled remediation action(s)` : "",
    dataHealth.missingSeedCount > 0 ? `${dataHealth.missingSeedCount} seeded case(s) missing` : "",
    dataHealth.benchmarkSignoffStatus === "not_accepted" ? "latest benchmark sign-off rejected evidence readiness" : "",
    dataHealth.benchmarkSignoffStatus === "unsigned" ? "benchmark evidence is unsigned" : ""
  ].filter(Boolean);
  const followUps = [
    dataHealth.benchmarkSignoffStatus === "accepted_with_follow_up" ? "benchmark accepted with follow-up" : "",
    dataHealth.openFeedbackItems > 0 ? `${dataHealth.openFeedbackItems} open feedback item(s)` : "",
    dataHealth.extraCaseCount > 0 ? `${dataHealth.extraCaseCount} extra session case(s) in dataset` : ""
  ].filter(Boolean);
  const status = blockers.length ? ("blocked" as const) : followUps.length ? ("needs_follow_up" as const) : ("ready" as const);

  return {
    status,
    label: status === "ready" ? "Ready for internal evidence" : status === "needs_follow_up" ? "Needs follow-up" : "Blocked",
    summary:
      status === "ready"
        ? "Benchmark, sign-off, data health, and operating queues are ready for internal evidence use."
        : status === "needs_follow_up"
          ? "Evidence is usable internally, but follow-up should be tracked before external reuse."
          : "Evidence should not be presented as ready until blockers are resolved.",
    blockers,
    followUps,
    checks: {
      benchmarkPassRate: benchmark.total ? Math.round((benchmark.passed / benchmark.total) * 100) : 0,
      benchmarkFailed: benchmark.failed,
      openBenchmarkActions: dataHealth.openBenchmarkActions,
      stalledRemediationActions: dataHealth.stalledRemediationActions,
      benchmarkSignoffStatus: dataHealth.benchmarkSignoffStatus,
      dataHealthState: dataHealth.state,
      buildGate: "npm run verify + npm run build passing"
    }
  };
}
