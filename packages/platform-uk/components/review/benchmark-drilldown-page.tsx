"use client";

import { useMemo } from "react";

import { useReviewCases } from "@/lib/use-review-cases";
import { BenchmarkRunbookPanel } from "./benchmark-runbook-panel";
import {
  createReviewerEvent,
  createScenarioBenchmarkActionResolution,
  deriveClinicalRuleCoverageMatrix,
  deriveScenarioBenchmark,
  deriveScenarioBenchmarkActionQueue
} from "@/lib/workflow";

type BenchmarkStatus = "all" | "failed" | "passed";

function normalizeStatus(status?: string): BenchmarkStatus {
  if (status === "failed" || status === "passed") return status;
  return "all";
}

export function BenchmarkDrilldownPage({
  demoMode = false,
  recordingMode = false,
  status
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  status?: string;
}) {
  const { cases, isLoaded, isSaving, updateCase } = useReviewCases();
  const selectedStatus = normalizeStatus(status);
  const modeParams = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const benchmark = useMemo(() => deriveScenarioBenchmark(cases), [cases]);
  const coverage = useMemo(() => deriveClinicalRuleCoverageMatrix(cases), [cases]);
  const actionQueue = useMemo(() => deriveScenarioBenchmarkActionQueue(cases), [cases]);
  const visibleCases = useMemo(
    () =>
      benchmark.cases.filter((item) => {
        if (selectedStatus === "failed") return !item.passed;
        if (selectedStatus === "passed") return item.passed;
        return true;
      }),
    [benchmark.cases, selectedStatus]
  );
  async function setBenchmarkActionStatus(
    item: (typeof actionQueue.items)[number] | (typeof actionQueue.resolvedItems)[number],
    nextStatus: "open" | "resolved"
  ) {
    if (!item.caseId) return;
    const reviewCase = cases.find((caseItem) => caseItem.id === item.caseId);
    if (!reviewCase) return;

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: [
        ...reviewCase.auditEvents,
        createReviewerEvent(
          "system",
          nextStatus === "resolved" ? "Benchmark action resolved" : "Benchmark action reopened",
          "Benchmark Drilldown",
          `${item.action} (${item.checkLabel})`
        )
      ],
      benchmarkActionResolutions: createScenarioBenchmarkActionResolution(reviewCase, {
        actionId: item.id,
        actionLabel: item.action,
        status: nextStatus,
        updatedBy: "Benchmark Drilldown",
        owner: item.owner,
        note:
          nextStatus === "resolved"
            ? `Marked resolved after reviewing expected ${item.expected} against actual ${item.actual}.`
            : "Reopened for further clinical rule review."
      })
    });
  }

  if (!isLoaded) {
    return <div className="panel">Loading benchmark drilldown...</div>;
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="actions">
          <a className="button secondary" href={`/review/ops${sharedQuery}`}>
            Back To Ops
          </a>
          <a className="button secondary" href={`/review/ops/report${sharedQuery}`}>
            Ops Report
          </a>
          <a className="button secondary" href={`/review/benchmarks/report${sharedQuery}`}>
            Report & Sign-Off
          </a>
          <a className="button secondary" href={`/api/benchmarks/evidence${sharedQuery}`}>
            Export JSON
          </a>
          <a className="button secondary" href={`/review${sharedQuery}`}>
            Review Queue
          </a>
        </div>
        <div className="row">
          <div>
            <span className="hero-kicker">Clinical Benchmark Drilldown</span>
            <h1>Expected Outcome Inspection</h1>
            <p>
              Inspect every benchmarked synthetic case against its expected finalization state, safety labels,
              validation findings, blockers, and promotion recommendation.
            </p>
          </div>
          <span className={`tag ${benchmark.failed ? "danger" : "ok"}`}>
            {benchmark.passed}/{benchmark.total} passing
          </span>
        </div>
      </div>

      <div className="panel stack">
        <div className="row">
          <div>
            <strong>Benchmark filters</strong>
            <p>Use failed-only view during clinical rule tuning, then return to all cases before stakeholder review.</p>
          </div>
          <div className="actions">
            <a className={`button ${selectedStatus === "all" ? "primary" : "secondary"}`} href={`/review/benchmarks?status=all${modeParams}`}>
              All ({benchmark.total})
            </a>
            <a className={`button ${selectedStatus === "failed" ? "primary" : "secondary"}`} href={`/review/benchmarks?status=failed${modeParams}`}>
              Failed ({benchmark.failed})
            </a>
            <a className={`button ${selectedStatus === "passed" ? "primary" : "secondary"}`} href={`/review/benchmarks?status=passed${modeParams}`}>
              Passed ({benchmark.passed})
            </a>
          </div>
        </div>
      </div>

      <BenchmarkRunbookPanel compact />

      <div className="panel stack">
        <div className="row">
          <div>
            <h2>Benchmark Action Queue</h2>
            <p>Failed benchmark checks and coverage gaps are translated into internal owner-ready clinical build actions.</p>
          </div>
          <span className={`tag ${actionQueue.high ? "danger" : actionQueue.total ? "warn" : "ok"}`}>
            {actionQueue.total ? `${actionQueue.total} open` : "clear"}
          </span>
        </div>
        <div className="list">
          {actionQueue.items.length ? (
            actionQueue.items.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.action}</strong>
                  <p>
                    {item.patientLabel} · {item.scenarioClass} · {item.checkLabel}
                  </p>
                  <p>Owner: {item.owner}</p>
                  <p>{item.rationale}</p>
                  <p>
                    Expected: {item.expected}; actual: {item.actual}
                  </p>
                </div>
                <div className="actions">
                  <span className={`tag ${item.severity === "high" ? "danger" : item.severity === "medium" ? "warn" : "ok"}`}>
                    {item.severity}
                  </span>
                  {item.caseId ? (
                    <a className="button secondary" href={`/cases/${item.caseId}${sharedQuery}`}>
                      Case
                    </a>
                  ) : null}
                  {item.caseId ? (
                    <button
                      className="button primary"
                      disabled={isSaving}
                      onClick={() => void setBenchmarkActionStatus(item, "resolved")}
                      type="button"
                    >
                      Mark Resolved
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No benchmark remediation actions</strong>
                <p>All benchmarked scenarios currently match expected outcomes and coverage targets are represented.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
        </div>
      </div>

      {actionQueue.resolvedItems.length ? (
        <div className="panel stack">
          <div className="row">
            <div>
              <h2>Resolved Benchmark Actions</h2>
              <p>Still-failing benchmark actions that the internal team has explicitly reviewed and closed.</p>
            </div>
            <span className="tag ok">{actionQueue.resolved} resolved</span>
          </div>
          <div className="list">
            {actionQueue.resolvedItems.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.action}</strong>
                  <p>
                    {item.patientLabel} · {item.scenarioClass} · {item.checkLabel}
                  </p>
                  <p>
                    Resolved by {item.resolvedBy ?? "Benchmark Drilldown"}
                    {item.resolvedAt ? ` at ${item.resolvedAt}` : ""}
                  </p>
                  {item.resolutionNote ? <p>{item.resolutionNote}</p> : null}
                </div>
                <div className="actions">
                  <span className="tag ok">resolved</span>
                  {item.caseId ? (
                    <button
                      className="button secondary"
                      disabled={isSaving}
                      onClick={() => void setBenchmarkActionStatus(item, "open")}
                      type="button"
                    >
                      Reopen
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel stack">
        <h2>Benchmarked Cases</h2>
        <div className="list">
          {visibleCases.length ? (
            visibleCases.map((item) => (
              <div className="stack row" key={item.caseId}>
                <div className="stack">
                  <div>
                    <strong>{item.patientLabel}</strong>
                    <p>{item.scenarioClass}</p>
                  </div>
                  <div className="list">
                    {item.checks.map((check) => (
                      <div className="row" key={check.label}>
                        <div>
                          <strong>{check.label}</strong>
                          <p>Expected: {check.expected}</p>
                          <p>Actual: {check.actual}</p>
                        </div>
                        <span className={`tag ${check.passed ? "ok" : "danger"}`}>
                          {check.passed ? "pass" : "fail"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="actions">
                  <span className={`tag ${item.passed ? "ok" : "danger"}`}>{item.passed ? "pass" : "fail"}</span>
                  <a className="button secondary" href={`/cases/${item.caseId}${sharedQuery}`}>
                    Case
                  </a>
                  <a className="button secondary" href={`/cases/${item.caseId}/evidence${sharedQuery}`}>
                    Evidence
                  </a>
                  <a className="button secondary" href={`/cases/${item.caseId}/dossier${sharedQuery}`}>
                    Dossier
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No cases in this filter</strong>
                <p>The selected benchmark filter has no matching cases.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
        </div>
      </div>

      <div className="panel stack">
        <h2>Clinical Rule Coverage</h2>
        <div className="list">
          <div className="row">
            <div>
              <strong>Coverage targets</strong>
              <p>
                {coverage.coveredTargets} of {coverage.totalTargets} UK clinical risk classes have benchmarked scenario coverage.
              </p>
            </div>
            <span className={`tag ${coverage.missingTargets ? "danger" : coverage.needsExpectedOutcomeTargets ? "warn" : "ok"}`}>
              {coverage.missingTargets} missing
            </span>
          </div>
          {coverage.rows.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <p>
                  {item.caseCount} case(s), {item.benchmarkedCount} benchmarked.
                </p>
                {item.cases.length ? <p>{item.cases.map((caseItem) => caseItem.patientLabel).join(", ")}</p> : null}
              </div>
              <span className={`tag ${item.status === "covered" ? "ok" : item.status === "needs_expected_outcome" ? "warn" : "danger"}`}>
                {item.status.replaceAll("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
