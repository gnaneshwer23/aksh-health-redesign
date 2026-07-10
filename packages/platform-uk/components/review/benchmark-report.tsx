"use client";

import { useMemo } from "react";

import { ReportActions } from "@/components/review/report-actions";
import { buildBenchmarkEvidencePayload } from "@/lib/benchmark-evidence";
import { useReviewCases } from "@/lib/use-review-cases";

import { BenchmarkRunbookPanel } from "./benchmark-runbook-panel";
import { BenchmarkSignoffPanel } from "./benchmark-signoff-panel";
import { KnownLimitationsFooter } from "./known-limitations-footer";

export function BenchmarkReport({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded } = useReviewCases();
  const query = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const evidence = useMemo(() => buildBenchmarkEvidencePayload(cases), [cases]);

  if (!isLoaded) {
    return <div className="panel">Loading benchmark evidence report...</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">Clinical Benchmark Evidence</span>
        <ReportActions backHref={`/review/benchmarks${query}`} />
        <h1>UK/EU Benchmark Evidence Report</h1>
        <p>
          Timestamped synthetic validation artifact showing expected-outcome performance, clinical rule coverage, and
          benchmark action status for the current proof dataset.
        </p>
        <div className="actions">
          <a className="button secondary" href={`/api/benchmarks/evidence${query}`}>
            Export JSON
          </a>
          <a className="button secondary" href={`/api/evidence/board-pack${query}`}>
            Export Board Pack
          </a>
          <a className="button secondary" href={`/review/ops${query}`}>
            Ops Dashboard
          </a>
        </div>
      </div>

      <section className="report-section">
        <h2>Run Summary</h2>
        <div className="grid">
          <div className="metric">
            <span className="meta">Benchmarked cases</span>
            <strong>{evidence.summary.benchmarkedCases}</strong>
          </div>
          <div className="metric">
            <span className="meta">Passed</span>
            <strong>{evidence.summary.passedCases}</strong>
          </div>
          <div className={`metric ${evidence.summary.failedCases ? "alert" : ""}`}>
            <span className="meta">Failed</span>
            <strong>{evidence.summary.failedCases}</strong>
          </div>
          <div className={`metric ${evidence.summary.openBenchmarkActions ? "alert" : ""}`}>
            <span className="meta">Open actions</span>
            <strong>{evidence.summary.openBenchmarkActions}</strong>
          </div>
        </div>
        <p>Generated at {evidence.generatedAt}. Synthetic-only artifact; not derived from real patient data.</p>
      </section>

      <section className="report-section">
        <BenchmarkRunbookPanel />
      </section>

      <section className="report-section">
        <BenchmarkSignoffPanel />
      </section>

      <section className="report-section">
        <h2>Expected Outcome Results</h2>
        <div className="list">
          {evidence.benchmark.cases.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>{item.scenarioClass}</p>
                {item.checks
                  .filter((check) => !check.passed)
                  .map((check) => (
                    <p key={check.label}>
                      {check.label}: expected {check.expected}; actual {check.actual}
                    </p>
                  ))}
              </div>
              <span className={`tag ${item.passed ? "ok" : "danger"}`}>{item.passed ? "pass" : "fail"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Coverage And Actions</h2>
        <div className="list">
          {evidence.coverage.rows.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.label}</strong>
                <p>
                  {item.caseCount} case(s), {item.benchmarkedCount} benchmarked.
                </p>
              </div>
              <span className={`tag ${item.status === "covered" ? "ok" : item.status === "needs_expected_outcome" ? "warn" : "danger"}`}>
                {item.status.replaceAll("_", " ")}
              </span>
            </div>
          ))}
          {evidence.actionQueue.items.map((item) => (
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
          {!evidence.actionQueue.items.length ? (
            <div className="row">
              <div>
                <strong>No open benchmark actions</strong>
                <p>All current benchmark failures and coverage gaps are closed or absent.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>

      <KnownLimitationsFooter artifactLabel="This benchmark evidence report" />
    </div>
  );
}
