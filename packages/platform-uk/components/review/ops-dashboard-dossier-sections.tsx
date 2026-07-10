"use client";

import type { OpsAnalytics } from "./ops-dashboard-section-types";

export function DossierReadinessCard({
  validationDossierAnalytics
}: {
  validationDossierAnalytics: OpsAnalytics["validationDossierAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Dossier Readiness</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Strong dossiers</strong>
            <p>Cases with high validation scores and no missing dossier sections.</p>
          </div>
          <span className="pill">{validationDossierAnalytics.strongDossiers}</span>
        </div>
        <div className="row">
          <div>
            <strong>Incomplete dossiers</strong>
            <p>Cases still missing one or more sections needed for a strong internal review package.</p>
          </div>
          <span className="pill">{validationDossierAnalytics.incompleteDossiers}</span>
        </div>
        {validationDossierAnalytics.topMissingSections.length ? (
          validationDossierAnalytics.topMissingSections.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Most common dossier section still missing across the current cohort.</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No missing dossier sections</strong>
              <p>The current cohort has strong dossier completeness across all tracked sections.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DossierSpotlightCasesCard({
  sharedQuery,
  validationDossierAnalytics
}: {
  sharedQuery: string;
  validationDossierAnalytics: OpsAnalytics["validationDossierAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Dossier Spotlight Cases</h3>
      <div className="list">
        {validationDossierAnalytics.spotlightCases.length ? (
          validationDossierAnalytics.spotlightCases.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>{item.summary}</p>
                <p>Score {item.overallScore} · {item.recommendation.replaceAll("_", " ")}</p>
                <p>{item.missingSections.length ? `Missing: ${item.missingSections.join(", ")}` : "No missing dossier sections"}</p>
              </div>
              <div className="actions">
                <a className="button secondary" href={`/cases/${item.caseId}/dossier${sharedQuery}`}>
                  Dossier
                </a>
                <a className="button secondary" href={`/cases/${item.caseId}${sharedQuery}`}>
                  Case
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No dossier spotlight cases</strong>
              <p>There are no cases available yet for dossier-level internal review spotlights.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MeetingReadyDossierBatchesCard({
  demoMode,
  recordingMode
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const modeQuery = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;

  return (
    <div className="span-6 panel stack">
      <h3>Meeting-Ready Dossier Batches</h3>
      <div className="list">
        {[
          ["strong", "Strong dossiers", "Open the highest-quality internal review packages first."],
          ["incomplete", "Incomplete dossiers", "Review cases still missing internal dossier sections."],
          ["near-promotion", "Near promotion", "Focus on cases closest to pilot-prep or RWE movement."],
          ["remediation", "Remediation dossiers", "Batch-review dossiers that still need remediation attention."]
        ].map(([filter, title, detail]) => (
          <div className="row" key={filter}>
            <div>
              <strong>{title}</strong>
              <p>{detail}</p>
            </div>
            <a className="button secondary" href={`/review/dossiers?filter=${filter}${modeQuery}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
