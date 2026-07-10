"use client";

import Link from "next/link";

import { DemoWalkthroughs } from "@/components/review/demo-walkthroughs";
import { useReviewCases } from "@/lib/use-review-cases";
import { deriveAcceptanceBlockers, deriveDataCollectionAnalytics, deriveReviewAnalytics, deriveSafetyFlags } from "@/lib/workflow";

export function SessionSummary({ demoMode = false, recordingMode = false }: { demoMode?: boolean; recordingMode?: boolean }) {
  const { cases, isLoaded } = useReviewCases();
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  if (!isLoaded) {
    return <div className="panel">Loading review session summary...</div>;
  }

  const acceptedCases = cases.filter((item) => item.status === "accepted");
  const blockedCases = cases.filter((item) => deriveAcceptanceBlockers(item).length > 0);
  const deferredCases = cases.filter((item) => item.status === "deferred");
  const highRiskCases = cases.filter((item) => deriveSafetyFlags(item).some((flag) => flag.severity === "high"));
  const analytics = deriveReviewAnalytics(cases);
  const dataCollectionAnalytics = deriveDataCollectionAnalytics(cases);
  const recentDecisions = [...cases]
    .filter((item) => item.reviewSummary?.lastDecision)
    .sort((left, right) =>
      (right.reviewSummary?.lastDecisionAt ?? right.updatedAt).localeCompare(left.reviewSummary?.lastDecisionAt ?? left.updatedAt)
    )
    .slice(0, 5);

  return (
    <div className="grid">
      <div className="span-12 panel stack">
        <div className="actions">
          <a className="button secondary" href={dashboardHref}>
            Back To Dashboard
          </a>
          <a className="button primary" href={`/review${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
            Open Review Queue
          </a>
          <a className="button secondary" href={`/review/presenter${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
            Presenter Guide
          </a>
          <a className="button secondary" href={`/review/pilot${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
            Pilot Package
          </a>
        </div>
        {demoMode || recordingMode ? (
          <div className="panel" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
            {recordingMode
              ? "Recording mode is active. This summary keeps only the highest-signal review outcomes and demo flow guidance."
              : "Demo mode is active. This summary emphasizes outcomes and walkthrough order over low-level implementation detail."}
          </div>
        ) : null}
        <h2>Review Session Summary</h2>
        <p>
          This page gives a demo-level summary of the current UK review proof state: what is blocked, what is high risk,
          and which reviewed artifacts are ready to show externally.
        </p>
      </div>

      <div className="span-3 metric">
        <span className="meta">Accepted artifacts</span>
        <strong>{acceptedCases.length}</strong>
      </div>
      <div className="span-3 metric alert">
        <span className="meta">Blocked cases</span>
        <strong>{blockedCases.length}</strong>
      </div>
      <div className="span-3 metric">
        <span className="meta">Deferred cases</span>
        <strong>{deferredCases.length}</strong>
      </div>
      <div className="span-3 metric alert">
        <span className="meta">High-risk cases</span>
        <strong>{highRiskCases.length}</strong>
      </div>
      <div className="span-3 metric">
        <span className="meta">Acceptance rate</span>
        <strong>{analytics.acceptanceRate}%</strong>
      </div>
      <div className="span-3 metric">
        <span className="meta">Avg decision time</span>
        <strong>{analytics.averageDecisionMinutes}m</strong>
      </div>
      <div className="span-3 metric">
        <span className="meta">Pilot-prep cohort</span>
        <strong>{dataCollectionAnalytics.streamCounts.ics_pilot_preparation}</strong>
      </div>
      <div className="span-3 metric">
        <span className="meta">RWE candidates</span>
        <strong>{dataCollectionAnalytics.streamCounts.rwe_pipeline_candidate}</strong>
      </div>

      <div className="span-12">
        {!recordingMode ? <DemoWalkthroughs demoMode={demoMode} recordingMode={recordingMode} /> : null}
      </div>

      <div className="span-6 panel stack">
        <h3>Accepted Artifacts</h3>
        <div className="list">
          {acceptedCases.length ? (
            acceptedCases.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>{item.frozenArtifact ? `Frozen ${item.frozenArtifact.frozenAt} by ${item.frozenArtifact.frozenBy}` : "Accepted without frozen metadata"}</p>
                </div>
                <div className="actions">
                  <a className="button secondary" href={`/cases/${item.id}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
                    Case
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}/evidence${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
                    Evidence
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No accepted artifacts yet</strong>
                <p>Accept a case to create a frozen reviewed artifact.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Blocked And High-Risk Cases</h3>
        <div className="list">
          {[...new Map([...blockedCases, ...highRiskCases].map((item) => [item.id, item])).values()].map((item) => {
            const blockers = deriveAcceptanceBlockers(item);
            const highRisk = deriveSafetyFlags(item).some((flag) => flag.severity === "high");

            return (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    {blockers.length
                      ? `Blocked: ${blockers[0]}`
                      : highRisk
                        ? "High-risk case with override/safety scrutiny required."
                        : "Requires review."}
                  </p>
                </div>
                <a className="button secondary" href={`/cases/${item.id}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
                  Open Case
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Operational Readout</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>Decision mix</strong>
              <p>
                Accepted {analytics.decisionCounts.accept}, rejected {analytics.decisionCounts.reject}, deferred{" "}
                {analytics.decisionCounts.defer}, pending {analytics.decisionCounts.pending}
              </p>
            </div>
          </div>
          <div className="row">
            <div>
              <strong>Top blocker category</strong>
              <p>{analytics.blockerCategories[0]?.label ?? "No active blockers"}</p>
            </div>
            <span className="pill">{analytics.blockerCategories[0]?.count ?? 0} cases</span>
          </div>
          <div className="row">
            <div>
              <strong>Most frequent safety flag</strong>
              <p>{analytics.safetyCategories[0]?.label ?? "No active safety flags"}</p>
            </div>
            <span className="pill">{analytics.safetyCategories[0]?.count ?? 0} flags</span>
          </div>
          <div className="row">
            <div>
              <strong>Validation stream focus</strong>
              <p>
                Synthetic {dataCollectionAnalytics.streamCounts.phase_1_synthetic}, remediation{" "}
                {dataCollectionAnalytics.streamCounts.phase_1_remediation}, pilot-prep{" "}
                {dataCollectionAnalytics.streamCounts.ics_pilot_preparation}, RWE{" "}
                {dataCollectionAnalytics.streamCounts.rwe_pipeline_candidate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Recent Decisions</h3>
        <div className="list">
          {recentDecisions.length ? (
            recentDecisions.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.reviewSummary?.lastDecision ? `Decision: ${item.reviewSummary.lastDecision}` : "No decision recorded"}</p>
                  <p>{item.reviewSummary?.reviewerNotes || "No reviewer notes captured."}</p>
                </div>
                <span className="meta">
                  {item.reviewSummary?.lastReviewer ?? "Unknown reviewer"}
                  <br />
                  {item.reviewSummary?.lastDecisionAt ?? item.updatedAt}
                </span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No recent decisions</strong>
                <p>Reviewer decisions will appear here as the demo progresses.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
