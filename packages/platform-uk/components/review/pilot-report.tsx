import { walkthroughs } from "@/components/review/demo-walkthroughs";

import { demoDataset, runbookSteps } from "./pilot-package";
import { ReportActions } from "./report-actions";

export function PilotReport({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const query = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">Stakeholder Report</span>
        <ReportActions backHref={`/review/pilot${query}`} />
        <h1>Pilot Package Report</h1>
        <p>
          External-facing handoff summary for the Aksh Health UK/EU proof: fixed demo dataset, reviewer runbook,
          acceptance signals, and audience walkthrough structure.
        </p>
        <div className="pill-row">
          <span className="pill">Generated {new Date().toLocaleString("en-GB")}</span>
          <span className="pill">Fixed cases {demoDataset.length}</span>
          <span className="pill">Audience tracks {walkthroughs.length}</span>
        </div>
      </div>

      <div className="report-grid">
        <section className="report-section">
          <h2>Purpose</h2>
          <p>
            This report packages the current proof as a repeatable pilot conversation tool. It is designed to support
            advisor, design-partner, and early stakeholder walkthroughs without requiring live system edits during the
            session.
          </p>
        </section>

        <section className="report-section">
          <h2>Fixed Demo Dataset</h2>
          <div className="list">
            {demoDataset.map((item) => (
              <div className="row" key={item.caseId}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.use}</p>
                </div>
                <div className="actions">
                  <span className="pill">{item.caseId}</span>
                  <a className="button secondary" href={`/cases/${item.caseId}${query}`}>
                    Case
                  </a>
                  <a className="button secondary" href={`/cases/${item.caseId}/evidence${query}`}>
                    Evidence
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="report-section">
          <h2>Reviewer Runbook</h2>
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
        </section>

        <section className="report-section">
          <h2>Acceptance Signals</h2>
          <div className="signal-grid">
            <div className="signal-card">
              <strong>Review safety visibility</strong>
              <p>Blocked or high-risk cases are shown before any accepted artifact to anchor the safety story.</p>
            </div>
            <div className="signal-card">
              <strong>Traceability</strong>
              <p>Every strong session includes source trace, generation trace, reviewer decision, and export evidence.</p>
            </div>
            <div className="signal-card">
              <strong>Frozen reviewed output</strong>
              <p>Accepted artifacts are presented as authoritative reviewed outputs, not as raw editable drafts.</p>
            </div>
          </div>
        </section>

        <section className="report-section">
          <h2>Audience Walkthrough Tracks</h2>
          <div className="list">
            {walkthroughs.map((walkthrough) => (
              <div className="row" key={walkthrough.audience}>
                <div>
                  <strong>{walkthrough.audience}</strong>
                  <p>{walkthrough.summary}</p>
                  <p>{walkthrough.steps.map((step) => step.title).join(" -> ")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
