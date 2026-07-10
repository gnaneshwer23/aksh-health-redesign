"use client";

import { useMemo } from "react";

import { useReviewCases } from "@/lib/use-review-cases";
import { deriveMeetingOutcomePriority, deriveValidationDossierBatchViews } from "@/lib/workflow";

const dossierFilters = [
  {
    id: "strong",
    label: "Strong Dossiers",
    description: "High-scoring cases with no missing dossier sections."
  },
  {
    id: "incomplete",
    label: "Incomplete Dossiers",
    description: "Cases still missing one or more dossier sections."
  },
  {
    id: "near-promotion",
    label: "Near Promotion",
    description: "Cases close to pilot-prep or RWE movement."
  },
  {
    id: "remediation",
    label: "Remediation Dossiers",
    description: "Cases still stuck in remediation and needing focused internal review."
  }
] as const;

export type DossierFilterId = (typeof dossierFilters)[number]["id"];

export function DossierBatchPage({
  demoMode = false,
  initialFilter = "strong",
  recordingMode = false
}: {
  demoMode?: boolean;
  initialFilter?: DossierFilterId;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded } = useReviewCases();

  const dossierViews = useMemo(() => deriveValidationDossierBatchViews(cases), [cases]);

  const filteredCases = useMemo(() => {
    const base =
      initialFilter === "incomplete"
        ? dossierViews.incomplete
        : initialFilter === "near-promotion"
          ? dossierViews.nearPromotion
          : initialFilter === "remediation"
            ? dossierViews.remediation
            : dossierViews.strong;

    return [...base].sort((left, right) => {
      const leftCase = cases.find((item) => item.id === left.id);
      const rightCase = cases.find((item) => item.id === right.id);
      const leftPriority = leftCase ? deriveMeetingOutcomePriority(leftCase).sortOrder : 99;
      const rightPriority = rightCase ? deriveMeetingOutcomePriority(rightCase).sortOrder : 99;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return right.overallScore - left.overallScore;
    });
  }, [cases, dossierViews, initialFilter]);

  const activeDefinition = dossierFilters.find((item) => item.id === initialFilter) ?? dossierFilters[0];
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  if (!isLoaded) {
    return <div className="panel">Loading dossier batches...</div>;
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="actions">
          {dossierFilters.map((filter) => (
            <a
              className={`button ${initialFilter === filter.id ? "primary" : "secondary"}`}
              href={`/review/dossiers?filter=${filter.id}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}
              key={filter.id}
            >
              {filter.label}
            </a>
          ))}
        </div>
        <div className="row">
          <div>
            <strong>{activeDefinition.label}</strong>
            <p>{activeDefinition.description}</p>
          </div>
          <span className="tag ok">{filteredCases.length} cases</span>
        </div>
      </div>

      <div className="panel stack">
        <h2>Meeting-Ready Dossier Batch</h2>
        <div className="list">
          {filteredCases.length ? (
            filteredCases.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    Score {item.overallScore} · {item.recommendation.replaceAll("_", " ")} · {item.readinessLabel}
                  </p>
                  {cases.find((reviewCase) => reviewCase.id === item.id)?.meetingOutcome ? (
                    <p>
                      Meeting outcome:{" "}
                      {deriveMeetingOutcomePriority(cases.find((reviewCase) => reviewCase.id === item.id)!).label}
                    </p>
                  ) : null}
                  <p>
                    {item.missingSections.length
                      ? `Missing: ${item.missingSections.join(", ")}`
                      : "No missing dossier sections"}
                  </p>
                </div>
                <div className="actions">
                  <a className="button secondary" href={`/cases/${item.id}/dossier${sharedQuery}`}>
                    Dossier
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}${sharedQuery}`}>
                    Case
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}/evidence${sharedQuery}`}>
                    Evidence
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No cases in this dossier batch</strong>
                <p>There are currently no cases matching the selected dossier review view.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
