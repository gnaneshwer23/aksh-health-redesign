"use client";

import Link from "next/link";

import { walkthroughs } from "@/components/review/demo-walkthroughs";

const talkTracks = {
  Product: {
    opener:
      "We are not showing generic AI automation here. We are showing a review-first clinical workflow that moves from incomplete draft to trusted reviewed artifact.",
    proofPoint:
      "The key product value is that the workflow makes risk, incompleteness, and clinician intervention visible before anything looks final.",
    close:
      "End on the accepted eczema artifact to show that the product can produce a confident, evidence-backed final output once review is complete."
  },
  Clinical: {
    opener:
      "Start by framing the product as a clinician support system, not an autonomous decision-maker. Safety visibility comes before efficiency.",
    proofPoint:
      "The important clinical proof is that high-severity medication issues and override requirements are surfaced as part of the review path, not buried after the fact.",
    close:
      "Finish by emphasizing that acceptance only happens after clinician confirmation, and that the accepted artifact is frozen and attributable."
  },
  Regulatory: {
    opener:
      "Lead with governance: accepted artifacts, blocked cases, reviewer attribution, source trace, and export validation.",
    proofPoint:
      "The strongest proof point is that the same system can show both what is ready for evidence export and what is explicitly not ready for acceptance.",
    close:
      "Finish on the contrast between a frozen reviewed artifact and a blocked case to underline control, auditability, and stop/go discipline."
  }
} as const;

export function PresenterGuide({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const summaryHref = `/review/summary${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const pilotHref = `/review/pilot${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const rehearsalHref = `/review/rehearsal${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const feedbackHref = `/review/feedback${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  return (
    <div className="layout-grid">
      <div className="span-12 panel stack">
        <div className="actions">
          <a className="button secondary" href={dashboardHref}>
            Back To Dashboard
          </a>
          <a className="button primary" href={summaryHref}>
            Session Summary
          </a>
          <a className="button secondary" href={pilotHref}>
            Pilot Package
          </a>
          <a className="button secondary" href={rehearsalHref}>
            Rehearsal Guide
          </a>
          <a className="button secondary" href={feedbackHref}>
            Feedback Capture
          </a>
        </div>
        {recordingMode ? (
          <div className="panel" style={{ background: "var(--accent-soft)", boxShadow: "none" }}>
            Recording mode is active. This guide keeps each talk track compact and optimized for live capture.
          </div>
        ) : null}
        <h2>Presenter Guide</h2>
        <p>
          This page turns the demo flows into short live talk tracks. Use it when you want a tighter, more repeatable
          narrative for product, clinical, or regulatory audiences.
        </p>
      </div>

      {walkthroughs.map((walkthrough) => {
        const track = talkTracks[walkthrough.audience as keyof typeof talkTracks];

        return (
          <div className="span-12 panel stack" key={walkthrough.audience}>
            <div className="row">
              <div>
                <strong>{walkthrough.audience} Demo Script</strong>
                <p>{walkthrough.summary}</p>
              </div>
              <span className="pill">{walkthrough.steps.length} steps</span>
            </div>

            <div className="list">
              <div className="row">
                <div>
                  <strong>Opening line</strong>
                  <p>{track.opener}</p>
                </div>
              </div>
              <div className="row">
                <div>
                  <strong>Main proof point</strong>
                  <p>{track.proofPoint}</p>
                </div>
              </div>
              <div className="row">
                <div>
                  <strong>Closing line</strong>
                  <p>{track.close}</p>
                </div>
              </div>
            </div>

            <div className="list">
              {walkthrough.steps.map((step) => {
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
                      <strong>{step.title}</strong>
                      <p>{step.detail}</p>
                    </div>
                    <a className="button secondary" href={stepHref}>
                      Open Step
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
