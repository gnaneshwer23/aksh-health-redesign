"use client";

import { walkthroughs } from "@/components/review/demo-walkthroughs";

const rehearsalPlans = {
  Product: {
    duration: "2 min",
    focus: "Show end-to-end workflow movement from blocked review state to accepted reviewed artifact.",
    checks: [
      "Blocked cohort opens cleanly and the acceptance blocker is obvious.",
      "Reviewer workflow can be described without diving into every field.",
      "Accepted artifact lands as the final proof point."
    ]
  },
  Clinical: {
    duration: "3 min",
    focus: "Show safety gating, override discipline, and clinician-in-the-loop review behavior.",
    checks: [
      "High-severity safety flags are visible before the reviewer story starts.",
      "Override or intolerance context is easy to explain.",
      "Final takeaway reinforces clinician control instead of automation."
    ]
  },
  Regulatory: {
    duration: "5 min",
    focus: "Show governance controls, frozen artifact traceability, and export readiness.",
    checks: [
      "Session summary frames accepted versus blocked evidence clearly.",
      "Accepted evidence page shows reviewer attribution, trace, validation, and bundle export.",
      "Blocked evidence contrast reinforces explicit stop/go control."
    ]
  }
} as const;

export function RehearsalGuide({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const pilotHref = `/review/pilot${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const presenterHref = `/review/presenter${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const feedbackHref = `/review/feedback${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  return (
    <div className="grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">Rehearsal</span>
        <div className="actions">
          <a className="button secondary" href={dashboardHref}>
            Back To Dashboard
          </a>
          <a className="button secondary" href={pilotHref}>
            Pilot Package
          </a>
          <a className="button primary" href={presenterHref}>
            Presenter Guide
          </a>
          <a className="button secondary" href={feedbackHref}>
            Feedback Capture
          </a>
        </div>
        <h2>Rehearsal Guide</h2>
        <p>
          Use this page to rehearse the pilot walkthrough before a live session. Each audience track includes a target
          duration, the proof focus, and a short readiness checklist.
        </p>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Audience drills</strong>
            <p>Three purpose-built rehearsal tracks for external sessions.</p>
            <span className="hero-stat-value">{walkthroughs.length}</span>
          </div>
          <div className="hero-stat">
            <strong>Total checkpoints</strong>
            <p>Short, repeatable flow anchors across all walkthroughs.</p>
            <span className="hero-stat-value">
              {walkthroughs.reduce((total, walkthrough) => total + walkthrough.steps.length, 0)}
            </span>
          </div>
          <div className="hero-stat">
            <strong>Readiness lens</strong>
            <p>Each track ends with explicit success checks before a live demo.</p>
            <span className="hero-stat-value">3</span>
          </div>
        </div>
      </div>

      {walkthroughs.map((walkthrough) => {
        const plan = rehearsalPlans[walkthrough.audience as keyof typeof rehearsalPlans];

        return (
          <div className="span-12 panel stack" key={walkthrough.audience}>
            <div className="row">
              <div>
                <strong>{walkthrough.audience} Rehearsal</strong>
                <p>{plan.focus}</p>
              </div>
              <span className="pill">{plan.duration}</span>
            </div>

            <div className="list">
              {walkthrough.steps.map((step, index) => {
                const stepHref =
                  "href" in step
                    ? step.href.includes("?")
                      ? `${step.href}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`
                      : `${step.href}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                    : "evidence" in step && step.evidence
                      ? `/cases/${step.caseId}/evidence${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                      : `/cases/${step.caseId}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

                return (
                  <div className="row" key={step.title}>
                    <div>
                      <strong>Checkpoint {index + 1}</strong>
                      <p>{step.title}</p>
                      <p>{step.detail}</p>
                    </div>
                    <a className="button secondary" href={stepHref}>
                      Open Step
                    </a>
                  </div>
                );
              })}
            </div>

            <div className="list">
              {plan.checks.map((check) => (
                <div className="row" key={check}>
                  <div>
                    <strong>Readiness check</strong>
                    <p>{check}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
