"use client";

import type { ReviewCase } from "@/lib/types";

export function GpPatientPanel({ reviewCase }: { reviewCase: ReviewCase }) {
  const hba1c = reviewCase.draft.observations.find((o) => o.codeText.toLowerCase().includes("hba1c"));
  const legSwelling = reviewCase.draft.observations.find((o) => o.codeText.toLowerCase().includes("leg") || o.codeText.toLowerCase().includes("swelling"));

  return (
    <section className="panel stack gp-panel">
      <div className="gp-panel__header">
        <p className="gp-panel__eyebrow">Column A · Patient panel</p>
        <h2>{reviewCase.patientLabel}</h2>
        {reviewCase.scenarioId ? <span className="pill">Scenario {reviewCase.scenarioId}</span> : null}
      </div>

      <div className="gp-patient-card">
        <h3>Active problems</h3>
        <ul className="gp-patient-list">
          <li>Type 2 diabetes mellitus</li>
          <li>{reviewCase.draft.condition.codeText}</li>
        </ul>
      </div>

      <div className="gp-patient-card">
        <h3>Current medications</h3>
        <ul className="gp-patient-list">
          {reviewCase.safetyContext.currentMedications.map((med) => (
            <li key={med}>{med}</li>
          ))}
        </ul>
      </div>

      <div className="gp-patient-card">
        <h3>Recent observations</h3>
        <ul className="gp-patient-list">
          {hba1c ? <li>HbA1c: {hba1c.valueText}</li> : null}
          {legSwelling ? <li>{legSwelling.codeText}: {legSwelling.valueText}</li> : null}
          {reviewCase.draft.observations
            .filter((o) => o !== hba1c && o !== legSwelling)
            .map((o) => (
              <li key={o.id}>
                {o.codeText}: {o.valueText}
              </li>
            ))}
        </ul>
      </div>

      <div className="gp-patient-card gp-patient-card--muted">
        <h3>Voice intake excerpt</h3>
        <p className="gp-intake-excerpt">{reviewCase.input.summary}</p>
        <p className="meta">
          {reviewCase.input.sourceType} · {Math.round(reviewCase.input.transcriptConfidence * 100)}% ASR confidence
        </p>
      </div>
    </section>
  );
}
