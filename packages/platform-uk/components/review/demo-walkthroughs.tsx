"use client";

import { DemoLauncher } from "@/components/review/demo-launcher";

export const walkthroughs = [
  {
    audience: "Product",
    summary: "Show the full workflow arc: queue, in-review case, then frozen artifact.",
    steps: [
      {
        title: "1. Start with the blocked queue",
        detail: "Open the blocked cohort to show how the system surfaces incomplete clinical drafts before acceptance.",
        href: "/review?filter=blocked"
      },
      {
        title: "2. Open the blocked BP scenario",
        detail: "Use the hypertension follow-up to show clinician review, acceptance blockers, and draft correction.",
        caseId: "case-002"
      },
      {
        title: "3. End on the clean accepted artifact",
        detail: "Show the frozen evidence output to land the story on a confident reviewed result.",
        caseId: "case-005",
        evidence: true
      }
    ]
  },
  {
    audience: "Clinical",
    summary: "Lead with safety gating, then reviewer intervention, then final evidence output.",
    steps: [
      {
        title: "1. Open the high-risk cohort",
        detail: "Start from cases with high-severity safety flags and explain how the workflow prioritizes them.",
        href: "/review?filter=high-risk"
      },
      {
        title: "2. Review the allergy/interaction case",
        detail: "Use the amoxicillin case to show allergy conflict, interaction review, and override discipline.",
        caseId: "case-001"
      },
      {
        title: "3. Show the override-path case",
        detail: "Use the statin intolerance case for a second safety example with more nuanced medication context.",
        caseId: "case-004"
      }
    ]
  },
  {
    audience: "Regulatory",
    summary: "Lead with reviewed outputs, validation, and frozen evidence artifacts rather than raw editing.",
    steps: [
      {
        title: "1. Open the session summary",
        detail: "Anchor the walkthrough in current proof state: accepted, blocked, deferred, and high-risk cohorts.",
        href: "/review/summary"
      },
      {
        title: "2. Open the accepted evidence artifact",
        detail: "Use the frozen eczema artifact to show reviewer attribution, source trace, validation, and export payload.",
        caseId: "case-005",
        evidence: true
      },
      {
        title: "3. Contrast with a blocked case",
        detail: "Show a case that is intentionally not ready for acceptance to reinforce governance and stop/go control.",
        caseId: "case-002",
        evidence: true
      }
    ]
  }
] as const;

export function DemoWalkthroughs({
  demoMode = false,
  recordingMode = false,
  onReset
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  onReset?: () => Promise<void>;
}) {
  return (
    <div className="panel stack">
      <h2>Recommended Demo Flows</h2>
      <div className="walkthrough-grid">
        {walkthroughs.map((walkthrough) => (
          <div className="walkthrough-card stack" key={walkthrough.audience}>
            <div className="stack" style={{ gap: 8 }}>
              <strong>{walkthrough.audience} Audience</strong>
              <p>{walkthrough.summary}</p>
            </div>
            <div className="list">
              {walkthrough.steps.map((step) => (
                (() => {
                  const isCaseStep = "caseId" in step;
                  const showEvidence = isCaseStep && "evidence" in step && Boolean(step.evidence);

                  return (
                    <div className="row" key={step.title}>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                      </div>
                      <div className="actions">
                        {"href" in step ? (
                          <a
                            className="button secondary"
                            href={
                              step.href.includes("?")
                                ? `${step.href}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`
                                : `${step.href}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                            }
                          >
                            Open
                          </a>
                        ) : null}
                        {isCaseStep && onReset ? (
                          <DemoLauncher
                            caseId={step.caseId}
                            demoMode={demoMode}
                            recordingMode={recordingMode}
                            label={showEvidence ? "Reset + Open Evidence" : "Reset + Open Case"}
                            mode={showEvidence ? "evidence" : "case"}
                            onReset={onReset}
                          />
                        ) : null}
                        {isCaseStep ? (
                          <a
                            className="button secondary"
                            href={
                              showEvidence
                                ? `/cases/${step.caseId}/evidence${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                                : `/cases/${step.caseId}${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`
                            }
                          >
                            {showEvidence ? "Evidence" : "Case"}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
