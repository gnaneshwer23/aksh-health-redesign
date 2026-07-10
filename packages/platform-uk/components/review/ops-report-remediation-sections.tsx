"use client";

import type { deriveOpsAnalytics } from "@/lib/ops-analytics";

type OpsAnalytics = ReturnType<typeof deriveOpsAnalytics>;

export function RemediationActionCohortsReportSection({
  query,
  remediationActionCohorts
}: {
  query: string;
  remediationActionCohorts: OpsAnalytics["remediationActionCohorts"];
}) {
  return (
    <section className="report-section">
      <h2>Remediation Action Cohorts</h2>
      <div className="list">
        {remediationActionCohorts.length ? (
          remediationActionCohorts.map((item) => (
            <div className="row" key={item.label}>
              <div>
                <strong>{item.label}</strong>
                <p>Action-based cohort for cases needing this exact remediation move.</p>
              </div>
              <div className="actions">
                <span className="pill">{item.count}</span>
                <a className="button secondary" href={`/review/failures?action=${encodeURIComponent(item.label)}${query}`}>
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
    </section>
  );
}

export function RemediationCompletionReportSection({
  remediationResolutionAnalytics
}: {
  remediationResolutionAnalytics: OpsAnalytics["remediationResolutionAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Remediation Completion Signals</h2>
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
    </section>
  );
}

export function RemediationTurnaroundReportSection({
  remediationTurnaroundAnalytics
}: {
  remediationTurnaroundAnalytics: OpsAnalytics["remediationTurnaroundAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Remediation Turnaround</h2>
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
    </section>
  );
}

export function StalledRemediationAlertsReportSection({
  query,
  remediationStalledAlerts
}: {
  query: string;
  remediationStalledAlerts: OpsAnalytics["remediationStalledAlerts"];
}) {
  return (
    <section className="report-section">
      <h2>Stalled Remediation Alerts</h2>
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
                <a className="button secondary" href={`/review/failures?action=${encodeURIComponent(item.actionLabel)}${query}`}>
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
    </section>
  );
}

export function OwnerStalledLoadReportSection({
  remediationOwnerLoad
}: {
  remediationOwnerLoad: OpsAnalytics["remediationOwnerLoad"];
}) {
  return (
    <section className="report-section">
      <h2>Owner-Level Stalled Load</h2>
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
    </section>
  );
}

export function RemediationHandoffChurnReportSection({
  query,
  remediationHandoffChurnAnalytics
}: {
  query: string;
  remediationHandoffChurnAnalytics: OpsAnalytics["remediationHandoffChurnAnalytics"];
}) {
  return (
    <section className="report-section">
      <h2>Remediation Handoff Churn</h2>
      <div className="list">
        <div className="row">
          <div>
            <strong>Total owner changes</strong>
            <p>Repeated stalled-remediation handoffs across the current cohort.</p>
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
    </section>
  );
}

export function CoordinationRiskReportSection({
  query,
  remediationChurnRisk
}: {
  query: string;
  remediationChurnRisk: OpsAnalytics["remediationChurnRisk"];
}) {
  return (
    <section className="report-section">
      <h2>Coordination Risk</h2>
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
    </section>
  );
}
