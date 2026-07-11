"use client";

import { walkthroughs } from "@/components/review/demo-walkthroughs";

export const demoDataset = [
  {
    caseId: "case-001",
    label: "High-risk respiratory medication case",
    use: "Safety escalation, allergy conflict, and medication interaction review."
  },
  {
    caseId: "case-002",
    label: "Blocked hypertension follow-up",
    use: "Acceptance blocker handling and incomplete vital remediation."
  },
  {
    caseId: "case-004",
    label: "Override-path lipid review",
    use: "Medication intolerance review and override discipline."
  },
  {
    caseId: "case-005",
    label: "Accepted frozen artifact",
    use: "Final reviewed output, export bundle, and evidence walkthrough."
  }
] as const;

export const runbookSteps = [
  "Reset the demo dataset before each live session so the starting state is stable.",
  "Begin in dashboard or session summary, depending on whether the audience is product or regulatory.",
  "Show one blocked or high-risk case before showing any accepted artifact.",
  "Use the evidence page to anchor reviewer attribution, source trace, validation, and export bundle.",
  "End on the accepted frozen artifact so the audience leaves with the reviewed-output story, not just the editing flow."
] as const;

export function PilotPackage({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const summaryHref = `/review/summary${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const presenterHref = `/review/presenter${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const rehearsalHref = `/review/rehearsal${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const feedbackHref = `/review/feedback${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  return (
    <div className="layout-grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">Pilot Ready</span>
        <div className="actions">
          <a className="button secondary" href={dashboardHref}>
            Back To Dashboard
          </a>
          <a className="button secondary" href={summaryHref}>
            Session Summary
          </a>
          <a className="button primary" href={presenterHref}>
            Presenter Guide
          </a>
          <a className="button secondary" href={rehearsalHref}>
            Rehearsal Guide
          </a>
          <a className="button secondary" href={`/review/pilot/report${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}>
            Stakeholder Report
          </a>
          <a className="button secondary" href={feedbackHref}>
            Feedback Capture
          </a>
        </div>
        <h2>Pilot Package</h2>
        <p>
          This page packages the current UK proof for pilot-style conversations: fixed demo cases, a reviewer runbook,
          and audience-specific walkthrough entry points.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Fixed dataset</strong>
            <p>Repeatable pilot story anchored in four curated cases.</p>
            <span className="hero-stat-value">{demoDataset.length}</span>
          </div>
          <div className="hero-stat">
            <strong>Runbook steps</strong>
            <p>Simple operator sequence for consistent live sessions.</p>
            <span className="hero-stat-value">{runbookSteps.length}</span>
          </div>
          <div className="hero-stat">
            <strong>Audience tracks</strong>
            <p>Product, clinical, and regulatory walkthrough packaging.</p>
            <span className="hero-stat-value">{walkthroughs.length}</span>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Fixed Demo Dataset</h3>
        <div className="list">
          {demoDataset.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.label}</strong>
                <p>{item.use}</p>
              </div>
              <div className="actions">
                <span className="pill">{item.caseId}</span>
                <a
                  className="button secondary"
                  href={`/cases/${item.caseId}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}
                >
                  Case
                </a>
                <a
                  className="button secondary"
                  href={`/cases/${item.caseId}/evidence${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}
                >
                  Evidence
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Reviewer Runbook</h3>
        <div className="list">
          {runbookSteps.map((step, index) => (
            <div className="row" key={step}>
              <div>
                <strong>Step {index + 1}</strong>
                <p>{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Pilot Acceptance Signals</h3>
        <div className="signal-grid">
          <div className="signal-card">
            <strong>Review safety visibility</strong>
            <p>Blocked cases and high-risk cases must be easy to explain before any accepted artifact is shown.</p>
          </div>
          <div className="signal-card">
            <strong>Traceability</strong>
            <p>Every pilot walkthrough should cover source trace, generation trace, reviewer decision, and export evidence.</p>
          </div>
          <div className="signal-card">
            <strong>Frozen reviewed output</strong>
            <p>The accepted artifact should be the endpoint for advisor and pilot conversations, not raw draft editing.</p>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Audience Walkthrough Pack</h3>
        <div className="list">
          {walkthroughs.map((walkthrough) => (
            <div className="row" key={walkthrough.audience}>
              <div>
                <strong>{walkthrough.audience}</strong>
                <p>{walkthrough.summary}</p>
                <p>{walkthrough.steps.map((step) => step.title).join(" -> ")}</p>
              </div>
              <a
                className="button secondary"
                href={`/review/presenter${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`}
              >
                Open Script
              </a>
              <a className="button secondary" href={rehearsalHref}>
                Rehearse
              </a>
              <a className="button secondary" href={feedbackHref}>
                Capture Feedback
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
