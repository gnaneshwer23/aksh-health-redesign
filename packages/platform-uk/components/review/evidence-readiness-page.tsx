"use client";

import { useMemo } from "react";

import { deriveDataHealthSummary, deriveEvidenceReadinessGate } from "@/lib/data-health";
import { useBenchmarkSignoff } from "@/lib/use-benchmark-signoff";
import { useFeedbackState } from "@/lib/use-feedback-state";
import { useReadinessHistory } from "@/lib/use-readiness-history";
import { useReviewCases } from "@/lib/use-review-cases";
import { deriveEvidenceReadinessTrend } from "@/lib/readiness-history-analytics";
import {
  deriveRemediationStalledAlerts,
  deriveScenarioBenchmark,
  deriveScenarioBenchmarkActionQueue
} from "@/lib/workflow";

import {
  BenchmarkActionQueueSummary,
  BenchmarkSignoffSummary,
  DataHealthSummaryRows,
  EvidenceReadinessGateCard,
  EvidenceReadinessTrendCard
} from "./quality-summary-cards";
import { ProofEmptyState } from "./proof-empty-state";

export function EvidenceReadinessPage({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded } = useReviewCases();
  const { archive, isLoaded: feedbackLoaded } = useFeedbackState();
  const { archive: signoffArchive, isLoaded: signoffLoaded } = useBenchmarkSignoff();
  const { archive: readinessArchive, isLoaded: readinessHistoryLoaded, isSaving: readinessHistorySaving, error: readinessHistoryError, saveSnapshot } = useReadinessHistory();
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const latestSignoff = signoffArchive[0];
  const benchmark = useMemo(() => deriveScenarioBenchmark(cases), [cases]);
  const actionQueue = useMemo(() => deriveScenarioBenchmarkActionQueue(cases), [cases]);
  const stalledRemediation = useMemo(() => deriveRemediationStalledAlerts(cases), [cases]);
  const dataHealth = useMemo(() => deriveDataHealthSummary(cases, archive, latestSignoff), [archive, cases, latestSignoff]);
  const readinessGate = useMemo(() => deriveEvidenceReadinessGate(cases, archive, latestSignoff), [archive, cases, latestSignoff]);
  const readinessTrend = useMemo(() => deriveEvidenceReadinessTrend(readinessArchive), [readinessArchive]);
  const openFeedback = useMemo(() => archive.filter((entry) => entry.resolutionStatus !== "resolved"), [archive]);

  if (!isLoaded || !feedbackLoaded) {
    return <div className="panel">Loading evidence readiness...</div>;
  }

  return (
    <div className="layout-grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">Evidence Readiness</span>
        <div className="actions">
          <a className="button secondary" href={`/review/ops${sharedQuery}`}>
            Ops Dashboard
          </a>
          <a className="button secondary" href={`/review/benchmarks/report${sharedQuery}`}>
            Benchmark Report
          </a>
          <a className="button secondary" href={`/review/benchmarks${sharedQuery}`}>
            Benchmark Drilldown
          </a>
          <a className="button secondary" href={`/review/feedback${sharedQuery}`}>
            Feedback
          </a>
          <a className="button secondary" href={`/api/readiness/evidence${sharedQuery}`}>
            Export Readiness JSON
          </a>
          <a className="button secondary" href={`/api/evidence/board-pack${sharedQuery}`}>
            Export Board Pack
          </a>
          <button data-testid="readiness-save-snapshot" className="button primary" disabled={readinessHistorySaving} onClick={() => void saveSnapshot()} type="button">
            Save Snapshot
          </button>
        </div>
        <h2>Internal Evidence Readiness Gate</h2>
        <p>
          One operational view for deciding whether the current UK/EU synthetic proof evidence is ready, needs follow-up,
          or is blocked before leadership/advisor reuse.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Status</strong>
            <p>{readinessGate.summary}</p>
            <span className="hero-stat-value">{readinessGate.label}</span>
          </div>
          <div className="hero-stat">
            <strong>Benchmark pass rate</strong>
            <p>
              {benchmark.passed} of {benchmark.total} benchmarked cases passing.
            </p>
            <span className="hero-stat-value">{readinessGate.checks.benchmarkPassRate}%</span>
          </div>
          <div className="hero-stat">
            <strong>Open actions</strong>
            <p>Benchmark and remediation work still visible in the proof system.</p>
            <span className="hero-stat-value">{actionQueue.total + stalledRemediation.length}</span>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Readiness Gate</h3>
        {readinessHistoryError ? (
          <div className="panel" style={{ background: "var(--danger-soft)", boxShadow: "none" }}>
            {readinessHistoryError}
          </div>
        ) : null}
        <div className="list">
          <EvidenceReadinessGateCard gate={readinessGate} />
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Readiness History</h3>
            <p>Saved snapshots of the readiness gate over time for internal evidence tracking.</p>
          </div>
          <span className="pill" data-testid="readiness-history-count">{readinessArchive.length} saved</span>
        </div>
        <EvidenceReadinessTrendCard isLoaded={readinessHistoryLoaded} trend={readinessTrend} />
        <div className="list">
          {!readinessHistoryLoaded ? (
            <div className="row">
              <div>
                <strong>Loading history</strong>
                <p>Fetching saved readiness snapshots.</p>
              </div>
              <span className="pill">loading</span>
            </div>
          ) : readinessArchive.length ? (
            readinessArchive.slice(0, 6).map((snapshot) => (
              <div className="row" key={snapshot.id}>
                <div>
                  <strong>{snapshot.gate.label}</strong>
                  <p>
                    Saved {snapshot.savedAt} · generated {snapshot.generatedAt}
                  </p>
                  <p>
                    Benchmark pass rate {snapshot.benchmarkSummary.passRate}%, open actions {snapshot.actionSummary.openBenchmarkActions}, sign-off {snapshot.dataHealth.benchmarkSignoffStatus.replaceAll("_", " ")}.
                  </p>
                </div>
                <span className={`tag ${snapshot.gate.status === "ready" ? "ok" : snapshot.gate.status === "needs_follow_up" ? "warn" : "danger"}`}>
                  {snapshot.gate.status.replaceAll("_", " ")}
                </span>
              </div>
            ))
          ) : (
            <ProofEmptyState
              actionHref={`/review/benchmarks/report${sharedQuery}`}
              actionLabel="Sign off first"
              detail="Save a snapshot after sign-off or follow-up review to preserve the readiness decision."
              status="empty"
              title="No snapshots saved yet"
            />
          )}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Blocking Work</h3>
        <div className="list">
          {readinessGate.blockers.length ? (
            readinessGate.blockers.map((item) => (
              <div className="row" key={item}>
                <div>
                  <strong>{item}</strong>
                  <p>Resolve this before presenting the benchmark evidence as ready.</p>
                </div>
                <span className="tag danger">blocker</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No readiness blockers</strong>
                <p>The gate is not blocked by benchmark failures, sign-off, seed data, or stalled remediation.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
          <div className="actions">
            <a className="button secondary" href={`/review/benchmarks?status=failed${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}>
              Failed Benchmarks
            </a>
            <a className="button secondary" href={`/review/failures${sharedQuery}`}>
              Failure Drilldown
            </a>
          </div>
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Follow-Up Work</h3>
        <div className="list">
          {readinessGate.followUps.length ? (
            readinessGate.followUps.map((item) => (
              <div className="row" key={item}>
                <div>
                  <strong>{item}</strong>
                  <p>Track this before external reuse or broader deployment packaging.</p>
                </div>
                <span className="tag warn">follow-up</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No follow-up warnings</strong>
                <p>No open feedback, extra session cases, or accepted-with-follow-up sign-off is currently active.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
          <div className="actions">
            <a className="button secondary" href={`/review/feedback${sharedQuery}`}>
              Feedback Workspace
            </a>
            <a className="button secondary" href={`/review/benchmarks/report${sharedQuery}`}>
              Sign-Off
            </a>
          </div>
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Benchmark Evidence State</h3>
        <div className="list">
          <BenchmarkActionQueueSummary actionQueue={actionQueue} />
          <BenchmarkSignoffSummary
            isLoaded={signoffLoaded}
            latest={latestSignoff}
            signoffActionLabel="Open sign-off"
            signoffHref={`/review/benchmarks/report${sharedQuery}`}
          />
          {actionQueue.items.slice(0, 4).map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.action}</strong>
                <p>
                  {item.patientLabel} · {item.owner} · {item.checkLabel}
                </p>
              </div>
              <span className={`tag ${item.severity === "high" ? "danger" : item.severity === "medium" ? "warn" : "ok"}`}>
                {item.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Data Health</h3>
        <div className="list">
          <DataHealthSummaryRows summary={dataHealth} />
          {openFeedback.slice(0, 4).map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.audience} feedback</strong>
                <p>
                  {item.followUpOwner || "Unassigned"} {item.dueDate ? `· due ${item.dueDate}` : ""}
                </p>
                <p>{item.nextActions || item.confusionPoint || item.objections || "Open feedback item"}</p>
              </div>
              <span className="tag warn">open</span>
            </div>
          ))}
          {!openFeedback.length ? (
            <ProofEmptyState
              actionHref={`/review/feedback${sharedQuery}`}
              actionLabel="Capture feedback"
              detail="No open feedback items are blocking readiness. Capture walkthrough notes when stakeholders raise questions."
              status="clear"
              title="No open feedback"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
