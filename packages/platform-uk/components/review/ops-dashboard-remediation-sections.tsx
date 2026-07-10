"use client";

import type { Dispatch, SetStateAction } from "react";

import type { OpsAnalytics } from "./ops-dashboard-section-types";

function modeQuery(demoMode?: boolean, recordingMode?: boolean) {
  return `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;
}

type StalledAlert = OpsAnalytics["remediationStalledAlerts"][number];

type RiskTriageDraft = {
  status: "escalated" | "parked" | "focused_recovery";
  owner: string;
  note: string;
  by: string;
};

export function StalledRemediationAlertsCard({
  demoMode,
  isSaving,
  recordingMode,
  remediationHandoffDrafts,
  remediationOwnerDrafts,
  remediationStalledAlerts,
  saveRemediationOwner,
  setRemediationHandoffDrafts,
  setRemediationOwnerDrafts
}: {
  demoMode?: boolean;
  isSaving: boolean;
  recordingMode?: boolean;
  remediationHandoffDrafts: Record<string, string>;
  remediationOwnerDrafts: Record<string, string>;
  remediationStalledAlerts: OpsAnalytics["remediationStalledAlerts"];
  saveRemediationOwner: (alert: StalledAlert) => Promise<void>;
  setRemediationHandoffDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setRemediationOwnerDrafts: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  const query = modeQuery(demoMode, recordingMode);

  return (
    <div className="span-6 panel stack">
      <h3>Stalled Remediation Alerts</h3>
      <div className="list">
        {remediationStalledAlerts.length ? (
          remediationStalledAlerts.map((item) => (
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
                    setRemediationOwnerDrafts((current) => ({
                      ...current,
                      [`${item.caseId}:${item.stepId}:${item.actionLabel}`]: event.target.value
                    }))
                  }
                  style={{ minWidth: 140 }}
                  value={remediationOwnerDrafts[`${item.caseId}:${item.stepId}:${item.actionLabel}`] ?? item.owner}
                />
                <input
                  onChange={(event) =>
                    setRemediationHandoffDrafts((current) => ({
                      ...current,
                      [`${item.caseId}:${item.stepId}:${item.actionLabel}`]: event.target.value
                    }))
                  }
                  placeholder="Handoff note"
                  style={{ minWidth: 200 }}
                  value={remediationHandoffDrafts[`${item.caseId}:${item.stepId}:${item.actionLabel}`] ?? ""}
                />
                <button
                  className="button secondary"
                  disabled={isSaving}
                  onClick={() => void saveRemediationOwner(item)}
                  type="button"
                >
                  Reassign
                </button>
                <a
                  className="button secondary"
                  href={`/review/failures?action=${encodeURIComponent(item.actionLabel)}${query}`}
                >
                  Open
                </a>
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
  );
}

export function OwnerStalledLoadCard({ remediationOwnerLoad }: { remediationOwnerLoad: OpsAnalytics["remediationOwnerLoad"] }) {
  return (
    <div className="span-6 panel stack">
      <h3>Owner-Level Stalled Load</h3>
      <div className="list">
        {remediationOwnerLoad.length ? (
          remediationOwnerLoad.map((item) => (
            <div className="row" key={item.owner}>
              <div>
                <strong>{item.owner}</strong>
                <p>{item.actionLabels.join(", ")}</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count} stalled</span>
                <span className="pill">{item.longestAgeMinutes}m longest</span>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No stalled owner load</strong>
              <p>No owners currently carry stalled remediation alerts.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemediationHandoffChurnCard({
  demoMode,
  recordingMode,
  remediationHandoffChurnAnalytics
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  remediationHandoffChurnAnalytics: OpsAnalytics["remediationHandoffChurnAnalytics"];
}) {
  const query = modeQuery(demoMode, recordingMode);

  return (
    <div className="span-6 panel stack">
      <h3>Remediation Handoff Churn</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Total owner changes</strong>
            <p>Repeated stalled-remediation handoffs across the active cohort.</p>
          </div>
          <span className="pill">{remediationHandoffChurnAnalytics.totalChurnEvents}</span>
        </div>
        {remediationHandoffChurnAnalytics.topCases.length ? (
          remediationHandoffChurnAnalytics.topCases.map((item) => (
            <div className="row" key={`${item.caseId}-${item.actionLabel}`}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>
                  {item.actionLabel} moved {item.ownerChangeCount} time(s); latest owner {item.latestOwner}.
                </p>
                <p>Owners: {item.owners.join(", ")}</p>
              </div>
              <div className="actions">
                <span className="tag warn">{item.ownerChangeCount} changes</span>
                <a className="button secondary" href={`/review/failures?action=${encodeURIComponent(item.actionLabel)}${query}`}>
                  Open
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No handoff churn yet</strong>
              <p>No stalled remediation action has been reassigned more than once.</p>
            </div>
            <span className="tag ok">stable</span>
          </div>
        )}
        {remediationHandoffChurnAnalytics.topActions.map((item) => (
          <div className="row" key={item.label}>
            <div>
              <strong>{item.label}</strong>
              <p>Remediation action type accumulating repeated owner changes.</p>
            </div>
            <span className="pill">{item.count} changes</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoordinationRiskCard({
  demoMode,
  isSaving,
  recordingMode,
  remediationChurnRisk,
  riskTriageDrafts,
  saveRiskTriage,
  setRiskTriageDrafts
}: {
  demoMode?: boolean;
  isSaving: boolean;
  recordingMode?: boolean;
  remediationChurnRisk: OpsAnalytics["remediationChurnRisk"];
  riskTriageDrafts: Record<string, RiskTriageDraft>;
  saveRiskTriage: (caseId: string) => Promise<void>;
  setRiskTriageDrafts: Dispatch<SetStateAction<Record<string, RiskTriageDraft>>>;
}) {
  const query = modeQuery(demoMode, recordingMode);

  return (
    <div className="span-6 panel stack">
      <h3>Coordination Risk</h3>
      <div className="list">
        {remediationChurnRisk.length ? (
          remediationChurnRisk.map((item) => (
            <div className="row" key={item.caseId}>
              <div>
                <strong>{item.patientLabel}</strong>
                <p>
                  {item.topAction} · owner {item.latestOwner}
                </p>
                <p>{item.drivers.join(", ")}</p>
                {item.triage ? (
                  <p>
                    Triaged as {item.triage.status.replaceAll("_", " ")} by {item.triage.updatedBy} at {item.triage.updatedAt}; owner{" "}
                    {item.triage.owner}
                  </p>
                ) : null}
                <p>
                  {item.triageSlaLabel}
                  {item.triageAgeHours !== null && item.triageThresholdHours !== null
                    ? ` · ${item.triageAgeHours}h old / ${item.triageThresholdHours}h target`
                    : ""}
                </p>
                {item.triage?.note ? <p>{item.triage.note}</p> : null}
              </div>
              <div className="actions">
                <span className={`tag ${item.level === "high" ? "danger" : item.level === "medium" ? "warn" : "ok"}`}>
                  {item.level}
                </span>
                <span
                  className={`tag ${
                    item.triageSlaStatus === "overdue"
                      ? "danger"
                      : item.triageSlaStatus === "due_now"
                        ? "warn"
                        : item.triageSlaStatus === "within_sla"
                          ? "ok"
                          : "warn"
                  }`}
                >
                  {item.triageSlaLabel}
                </span>
                <span className="pill">{item.score}</span>
                <select
                  onChange={(event) =>
                    setRiskTriageDrafts((current) => ({
                      ...current,
                      [item.caseId]: {
                        ...(current[item.caseId] ?? {
                          owner: item.latestOwner,
                          note: "",
                          by: "Ops Dashboard"
                        }),
                        status: event.target.value as RiskTriageDraft["status"]
                      }
                    }))
                  }
                  value={riskTriageDrafts[item.caseId]?.status ?? item.triage?.status ?? "focused_recovery"}
                >
                  <option value="focused_recovery">Focused recovery</option>
                  <option value="escalated">Escalated</option>
                  <option value="parked">Parked</option>
                </select>
                <input
                  onChange={(event) =>
                    setRiskTriageDrafts((current) => ({
                      ...current,
                      [item.caseId]: {
                        ...(current[item.caseId] ?? {
                          status: item.triage?.status ?? "focused_recovery",
                          note: "",
                          by: "Ops Dashboard"
                        }),
                        owner: event.target.value
                      }
                    }))
                  }
                  placeholder="Owner"
                  style={{ minWidth: 140 }}
                  value={riskTriageDrafts[item.caseId]?.owner ?? item.triage?.owner ?? item.latestOwner}
                />
                <input
                  onChange={(event) =>
                    setRiskTriageDrafts((current) => ({
                      ...current,
                      [item.caseId]: {
                        ...(current[item.caseId] ?? {
                          status: item.triage?.status ?? "focused_recovery",
                          owner: item.triage?.owner ?? item.latestOwner,
                          by: "Ops Dashboard"
                        }),
                        note: event.target.value
                      }
                    }))
                  }
                  placeholder="Triage note"
                  style={{ minWidth: 180 }}
                  value={riskTriageDrafts[item.caseId]?.note ?? item.triage?.note ?? ""}
                />
                <button
                  className="button secondary"
                  disabled={isSaving}
                  onClick={() => void saveRiskTriage(item.caseId)}
                  type="button"
                >
                  Save Triage
                </button>
                <a className="button secondary" href={`/review/failures?action=${encodeURIComponent(item.topAction)}${query}`}>
                  Open
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No coordination risk detected</strong>
              <p>No current case combines churn, stalled remediation, blockers, or high-priority concerns.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemediationActionCohortsCard({
  demoMode,
  recordingMode,
  remediationActionCohorts
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
  remediationActionCohorts: OpsAnalytics["remediationActionCohorts"];
}) {
  const modeQuery = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;

  return (
    <div className="span-6 panel stack">
      <h3>Remediation Action Cohorts</h3>
      <div className="list">
        {remediationActionCohorts.length ? (
          remediationActionCohorts.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>One-click cohort for cases that need this exact remediation action.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count}</span>
                <a className="button secondary" href={`/review/failures?action=${encodeURIComponent(item.label)}${modeQuery}`}>
                  Open
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No remediation cohorts yet</strong>
              <p>No action-based remediation queues are currently populated.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemediationCompletionSignalsCard({
  remediationResolutionAnalytics
}: {
  remediationResolutionAnalytics: OpsAnalytics["remediationResolutionAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Remediation Completion Signals</h3>
      <div className="list">
        {remediationResolutionAnalytics.length ? (
          remediationResolutionAnalytics.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Resolution count for this remediation action across persisted case history.</p>
              </div>
              <span className="pill">{item.count}</span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No remediation completions yet</strong>
              <p>Resolve actions from the remediation workspace to start measuring closure patterns.</p>
            </div>
            <span className="tag warn">pending</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RemediationTurnaroundCard({
  remediationTurnaroundAnalytics
}: {
  remediationTurnaroundAnalytics: OpsAnalytics["remediationTurnaroundAnalytics"];
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Remediation Turnaround</h3>
      <div className="list">
        {remediationTurnaroundAnalytics.length ? (
          remediationTurnaroundAnalytics.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Average time to move from open to resolved for this remediation action.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.averageMinutes}m</span>
                <span className="pill">{item.resolvedCount} closures</span>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No turnaround data yet</strong>
              <p>Resolve and reopen remediation actions over time to start measuring closure speed.</p>
            </div>
            <span className="tag warn">pending</span>
          </div>
        )}
      </div>
    </div>
  );
}
