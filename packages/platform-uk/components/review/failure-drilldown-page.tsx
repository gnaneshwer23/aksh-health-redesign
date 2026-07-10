"use client";

import { useEffect, useMemo, useState } from "react";

import { useReviewCases } from "@/lib/use-review-cases";
import { createReviewerEvent, createRemediationActionResolution, deriveRemediationActionCohorts, deriveRemediationStalledAlerts, deriveValidationFailureDrilldown } from "@/lib/workflow";

export function FailureDrilldownPage({
  demoMode = false,
  recordingMode = false,
  stage,
  step,
  action
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  stage?: string;
  step?: string;
  action?: string;
}) {
  const { cases, isLoaded, isSaving, updateCase } = useReviewCases();
  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const actionCohorts = useMemo(() => deriveRemediationActionCohorts(cases), [cases]);
  const stalledAlerts = useMemo(() => deriveRemediationStalledAlerts(cases), [cases]);
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [handoffNoteDrafts, setHandoffNoteDrafts] = useState<Record<string, string>>({});

  const drilldown = useMemo(
    () => deriveValidationFailureDrilldown(cases, { stage, step, action }),
    [action, cases, stage, step]
  );

  useEffect(() => {
    setOwnerDrafts(
      Object.fromEntries(
        stalledAlerts.map((item) => [`${item.caseId}:${item.stepId}:${item.actionLabel}`, item.owner])
      )
    );
    setHandoffNoteDrafts(
      Object.fromEntries(
        stalledAlerts.map((item) => [`${item.caseId}:${item.stepId}:${item.actionLabel}`, item.handoffNote ?? ""])
      )
    );
  }, [stalledAlerts]);

  if (!isLoaded) {
    return <div className="panel">Loading failure drilldown...</div>;
  }

  async function toggleAction(
    caseId: string,
    match: { id: string; title: string; stage: string },
    actionItem: { label: string; detail: string; status: "open" | "resolved" }
  ) {
    const reviewCase = cases.find((item) => item.id === caseId);
    if (!reviewCase) return;

    const nextStatus = actionItem.status === "resolved" ? "open" : "resolved";
    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: [
        ...reviewCase.auditEvents,
        createReviewerEvent(
          "system",
          nextStatus === "resolved" ? "Remediation action resolved" : "Remediation action reopened",
          "Remediation Workspace",
          `${actionItem.label} (${match.title})`
        )
      ],
      remediationActionResolutions: createRemediationActionResolution(reviewCase, {
        stepId: match.id,
        stepTitle: match.title,
        stage: match.stage,
        actionLabel: actionItem.label,
        detail: actionItem.detail,
        status: nextStatus,
        updatedBy: "Remediation Workspace",
        owner: reviewCase.meetingOutcome?.followThroughOwner?.trim() || undefined
      })
    });
  }

  async function reassignStalledAlert(alert: {
    caseId: string;
    stepId: string;
    stepTitle: string;
    stage: string;
    actionLabel: string;
    detail: string;
    handoffNote?: string;
    handoffHistory: Array<{
      id: string;
      fromOwner: string;
      toOwner: string;
      note?: string;
      by: string;
      at: string;
    }>;
  }) {
    const reviewCase = cases.find((item) => item.id === alert.caseId);
    const draftKey = `${alert.caseId}:${alert.stepId}:${alert.actionLabel}`;
    const nextOwner = ownerDrafts[`${alert.caseId}:${alert.stepId}:${alert.actionLabel}`]?.trim();
    const handoffNote = handoffNoteDrafts[draftKey]?.trim();
    if (!reviewCase || !nextOwner) return;

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      auditEvents: [
        ...reviewCase.auditEvents,
        createReviewerEvent(
          "system",
          "Remediation owner reassigned",
          "Remediation Workspace",
          `${alert.actionLabel} (${alert.stepTitle}) -> ${nextOwner}${handoffNote ? ` | ${handoffNote}` : ""}`
        )
      ],
      remediationActionResolutions: createRemediationActionResolution(reviewCase, {
        stepId: alert.stepId,
        stepTitle: alert.stepTitle,
        stage: alert.stage,
        actionLabel: alert.actionLabel,
        detail: alert.detail,
        status: "open",
        updatedBy: "Remediation Workspace",
        owner: nextOwner,
        handoffNote: handoffNote || undefined
      })
    });
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="actions">
          <a className="button secondary" href={`/review/ops${sharedQuery}`}>
            Back To Ops
          </a>
          <a className="button secondary" href={`/review${sharedQuery}`}>
            Review Queue
          </a>
        </div>
        <div className="row">
          <div>
            <strong>Validation failure drilldown</strong>
            <p>
              {stage ? `${stage}` : "All transition stages"}
              {step ? ` · ${step}` : " · All open failure steps"}
              {action ? ` · ${action}` : ""}
            </p>
          </div>
          <span className="tag warn">{drilldown.length} cases</span>
        </div>
      </div>

      <div className="panel stack">
        <h2>Remediation action cohorts</h2>
        <div className="actions">
          {actionCohorts.map((item) => (
            <a
              className={`button ${action === item.label ? "primary" : "secondary"}`}
              href={`/review/failures?action=${encodeURIComponent(item.label)}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}
              key={item.label}
            >
              {item.label} ({item.count})
            </a>
          ))}
        </div>
      </div>

      <div className="panel stack">
        <h2>Stalled remediation alerts</h2>
        <div className="list">
          {stalledAlerts.length ? (
            stalledAlerts.map((item) => (
              <div className="row" key={`${item.caseId}-${item.actionLabel}`}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>
                    {item.actionLabel} · {item.stage}
                  </p>
                  <p>Owner: {item.owner}</p>
                  {item.handoffNote ? <p>Handoff note: {item.handoffNote}</p> : null}
                  {item.handoffHistory.length > 1 ? (
                    <div className="stack" style={{ marginTop: 8 }}>
                      <p>Handoff history</p>
                      {item.handoffHistory
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <div key={entry.id}>
                            <p>
                              {entry.fromOwner} -&gt; {entry.toOwner}
                            </p>
                            <p>
                              {entry.by} at {entry.at}
                            </p>
                            {entry.note ? <p>{entry.note}</p> : null}
                          </div>
                        ))}
                    </div>
                  ) : null}
                  <p>{item.detail}</p>
                </div>
                <div className="actions">
                  <span className="tag danger">{item.ageMinutes}m open</span>
                  <span className="pill">target {item.thresholdMinutes}m</span>
                  <input
                    onChange={(event) =>
                      setOwnerDrafts((current) => ({
                        ...current,
                        [`${item.caseId}:${item.stepId}:${item.actionLabel}`]: event.target.value
                      }))
                    }
                    style={{ minWidth: 140 }}
                    value={ownerDrafts[`${item.caseId}:${item.stepId}:${item.actionLabel}`] ?? item.owner}
                  />
                  <input
                    onChange={(event) =>
                      setHandoffNoteDrafts((current) => ({
                        ...current,
                        [`${item.caseId}:${item.stepId}:${item.actionLabel}`]: event.target.value
                      }))
                    }
                    placeholder="Handoff note"
                    style={{ minWidth: 200 }}
                    value={handoffNoteDrafts[`${item.caseId}:${item.stepId}:${item.actionLabel}`] ?? ""}
                  />
                  <button
                    className="button secondary"
                    disabled={isSaving}
                    onClick={() => void reassignStalledAlert(item)}
                    type="button"
                  >
                    Reassign
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No stalled remediation alerts</strong>
                <p>No open remediation actions are currently past their turnaround threshold.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
        </div>
      </div>

      <div className="panel stack">
        <h2>Cases blocked by this failure</h2>
        <div className="list">
          {drilldown.length ? (
            drilldown.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    Score {item.overallScore} · {item.recommendation.replaceAll("_", " ")} · {item.readinessLabel}
                  </p>
                  {item.matchingSteps.map((match) => (
                    <div key={match.id} style={{ marginTop: 8 }}>
                      <p>
                        {match.stage}: {match.title} · {match.detail}
                      </p>
                      {match.remediationActions?.length ? (
                        <div className="stack" style={{ marginTop: 6 }}>
                          {match.remediationActions.map((action, index) => (
                            <div className="row" key={`${match.id}-${index}`}>
                              <div>
                                <p>
                                  {action.label}: {action.detail}
                                </p>
                                {action.updatedAt ? (
                                  <p>
                                    {action.status === "resolved" ? "Resolved" : "Reopened"} by {action.updatedBy || "workspace"} at {action.updatedAt}
                                  </p>
                                ) : null}
                              </div>
                              <button
                                className={`button ${action.status === "resolved" ? "secondary" : "primary"}`}
                                disabled={isSaving}
                                onClick={() => void toggleAction(item.id, match, action)}
                                type="button"
                              >
                                {action.status === "resolved" ? "Reopen" : "Mark Resolved"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="actions">
                  <a className="button secondary" href={`/cases/${item.id}${sharedQuery}`}>
                    Case
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}/dossier${sharedQuery}`}>
                    Dossier
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
                <strong>No matching failures</strong>
                <p>No current cases match the selected failed stage or transition step.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
