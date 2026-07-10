import type { deriveDataHealthSummary, deriveEvidenceReadinessGate } from "@/lib/data-health";
import type { deriveEvidenceReadinessTrend } from "@/lib/readiness-history-analytics";
import type { deriveScenarioBenchmarkActionQueue } from "@/lib/workflow";
import type { BenchmarkSignoffEntry } from "@/lib/benchmark-signoff-types";

import { ProofEmptyState } from "./proof-empty-state";

const signoffLabels = {
  accepted_for_internal_evidence: "accepted for evidence",
  accepted_with_follow_up: "accepted with follow-up",
  not_accepted: "not accepted"
} as const;

export function BenchmarkActionQueueSummary({
  actionQueue
}: {
  actionQueue: ReturnType<typeof deriveScenarioBenchmarkActionQueue>;
}) {
  return (
    <div className="row">
      <div>
        <strong>Benchmark action queue</strong>
        <p>Owner-ready remediation actions generated from failed checks and coverage gaps.</p>
      </div>
      <span className={`tag ${actionQueue.high ? "danger" : actionQueue.total ? "warn" : "ok"}`}>
        {actionQueue.total ? `${actionQueue.total} open` : "clear"}
      </span>
    </div>
  );
}

export function DataHealthSummaryRows({
  summary
}: {
  summary: ReturnType<typeof deriveDataHealthSummary>;
}) {
  return (
    <>
      <div className="row">
        <div>
          <strong>Dataset state</strong>
          <p>
            {summary.presentSeedCount} of {summary.seedCaseCount} seed cases present, {summary.extraCaseCount} extra
            case(s), {summary.missingSeedCount} missing seed case(s).
          </p>
        </div>
        <span className={`tag ${summary.state === "clean_seed" ? "ok" : summary.state === "session_modified" ? "warn" : "danger"}`}>
          {summary.state.replaceAll("_", " ")}
        </span>
      </div>
      <div className="row">
        <div>
          <strong>Open operating state</strong>
          <p>
            Benchmark actions {summary.openBenchmarkActions}, stalled remediation {summary.stalledRemediationActions},
            feedback items {summary.openFeedbackItems}.
          </p>
          <p>
            Benchmark sign-off: {summary.benchmarkSignoffStatus.replaceAll("_", " ")}
            {summary.benchmarkSignedBy ? ` by ${summary.benchmarkSignedBy}` : ""}.
          </p>
        </div>
        <span className="pill">{summary.resolvedBenchmarkActions} benchmark resolved</span>
      </div>
    </>
  );
}

export function BenchmarkSignoffSummary({
  latest,
  isLoaded,
  signoffHref,
  signoffActionLabel = "Open sign-off"
}: {
  latest?: BenchmarkSignoffEntry;
  isLoaded: boolean;
  signoffHref?: string;
  signoffActionLabel?: string;
}) {
  if (!isLoaded) {
    return (
      <div className="row">
        <div>
          <strong>Benchmark sign-off</strong>
          <p>Loading latest benchmark review decision.</p>
        </div>
        <span className="pill">loading</span>
      </div>
    );
  }

  if (!latest) {
    return (
      <ProofEmptyState
        actionHref={signoffHref}
        actionLabel={signoffActionLabel}
        detail="Complete benchmark review and save a sign-off decision before presenting evidence as ready."
        status="warn"
        title="No benchmark sign-off saved yet"
      />
    );
  }

  return (
    <div className="row" data-testid="readiness-benchmark-signoff-summary">
      <div>
        <strong>Benchmark sign-off</strong>
        <p>
          {latest.reviewerName} · {signoffLabels[latest.decision]} · {latest.signedAt}
        </p>
        <p>
          Benchmark {latest.passedCases}/{latest.benchmarkedCases} passing, {latest.openBenchmarkActions} open action(s).
          {latest.followUpOwner || latest.dueDate
            ? ` Follow-up: ${latest.followUpOwner || "Unassigned"}${latest.dueDate ? ` by ${latest.dueDate}` : ""}.`
            : ""}
        </p>
      </div>
      <span className={`tag ${latest.decision === "accepted_for_internal_evidence" ? "ok" : latest.decision === "not_accepted" ? "danger" : "warn"}`}>
        {signoffLabels[latest.decision]}
      </span>
    </div>
  );
}

export function EvidenceReadinessGateCard({
  gate
}: {
  gate: ReturnType<typeof deriveEvidenceReadinessGate>;
}) {
  return (
    <div className="row">
      <div>
        <strong>Evidence readiness gate</strong>
        <p>{gate.summary}</p>
        <p>
          Build gate: {gate.checks.buildGate}. Benchmark pass rate: {gate.checks.benchmarkPassRate}%.
        </p>
        {gate.blockers.length ? <p>Blockers: {gate.blockers.join("; ")}.</p> : null}
        {gate.followUps.length ? <p>Follow-up: {gate.followUps.join("; ")}.</p> : null}
      </div>
      <span className={`tag ${gate.status === "ready" ? "ok" : gate.status === "needs_follow_up" ? "warn" : "danger"}`}>
        {gate.label}
      </span>
    </div>
  );
}

export function EvidenceReadinessTrendCard({
  trend,
  isLoaded,
  readinessHref,
  readinessActionLabel = "Open readiness"
}: {
  trend: ReturnType<typeof deriveEvidenceReadinessTrend>;
  isLoaded: boolean;
  readinessHref?: string;
  readinessActionLabel?: string;
}) {
  if (!isLoaded) {
    return (
      <div className="row">
        <div>
          <strong>Readiness trend</strong>
          <p>Loading saved readiness snapshots.</p>
        </div>
        <span className="pill">loading</span>
      </div>
    );
  }

  if (trend.snapshotCount === 0) {
    return (
      <ProofEmptyState
        actionHref={readinessHref}
        actionLabel={readinessActionLabel}
        detail="Use Save Snapshot after sign-off or follow-up review to track readiness over time."
        status="empty"
        title="No readiness history yet"
      />
    );
  }

  return (
    <div className="row">
      <div>
        <strong>Readiness trend</strong>
        <p>{trend.summary}</p>
        <p>
          Snapshots {trend.snapshotCount}, pass-rate delta {trend.passRateDelta}, open-action delta {trend.openActionDelta}, status-score delta {trend.statusScoreDelta}.
        </p>
      </div>
      <span className={`tag ${trend.direction === "improving" ? "ok" : trend.direction === "regressing" ? "danger" : "warn"}`}>
        {trend.direction.replaceAll("_", " ")}
      </span>
    </div>
  );
}
