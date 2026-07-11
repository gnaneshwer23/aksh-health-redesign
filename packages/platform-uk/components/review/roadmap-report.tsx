"use client";

import { useMemo } from "react";

import { ReportActions } from "@/components/review/report-actions";
import { buildRoadmapEvidencePayload } from "@/lib/roadmap-evidence";
import { statusLabel, type RoadmapBuildStatus, type RoadmapRisk } from "@/lib/roadmap";
import { useRoadmapState } from "@/lib/use-roadmap-state";

const statusClass: Record<RoadmapBuildStatus, string> = {
  built: "ok",
  partial: "warn",
  planned: "",
  not_started: "warn",
  blocked: "danger"
};

const riskClass: Record<RoadmapRisk, string> = {
  low: "ok",
  medium: "",
  high: "warn",
  critical: "danger"
};

const dueDateStatusClass = {
  overdue: "danger",
  due_this_week: "warn",
  waiting_on_evidence: "warn",
  on_track: "ok",
  done: "ok"
} as const;

function formatDueDateStatus(status: keyof typeof dueDateStatusClass) {
  return status.replaceAll("_", " ");
}

export function RoadmapReport() {
  const { state, isLoaded } = useRoadmapState();
  const evidence = useMemo(() => buildRoadmapEvidencePayload(state), [state]);
  const actionResolutionById = useMemo(
    () => new Map(evidence.m1Checklist.actionResolutions.map((resolution) => [resolution.actionId, resolution])),
    [evidence.m1Checklist.actionResolutions]
  );

  if (!isLoaded) {
    return <div className="panel">Loading roadmap evidence report...</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">12-Month Roadmap Evidence</span>
        <ReportActions backHref="/review/roadmap" />
        <h1>UK/EU Roadmap Evidence Report</h1>
        <p>
          Printable operating view of the 12-month execution plan, current build reality, urgent next-30-day work,
          budget mismatch, and strict synthetic-proof boundaries.
        </p>
        <div className="actions">
          <a className="button secondary" href="/api/roadmap/evidence">
            Export JSON
          </a>
          <a className="button secondary" href="/review/roadmap">
            Roadmap Tracker
          </a>
          <a className="button secondary" href="/review/roadmap/m1-pack">
            M1 Evidence Pack
          </a>
          <a className="button secondary" href="/review/roadmap/actions">
            M1 Action Inbox
          </a>
          <a className="button secondary" href="/review/roadmap/actions/report">
            M1 Action Report
          </a>
        </div>
      </div>

      <section className="report-section">
        <h2>Executive Summary</h2>
        <div className="layout-grid">
          <div className="metric">
            <span className="meta">Roadmap items</span>
            <strong>{evidence.summary.totalItems}</strong>
          </div>
          <div className="metric">
            <span className="meta">Partial or built</span>
            <strong>{evidence.summary.partial + evidence.summary.built}</strong>
          </div>
          <div className={`metric ${evidence.summary.blocked ? "alert" : ""}`}>
            <span className="meta">Blocked</span>
            <strong>{evidence.summary.blocked}</strong>
          </div>
          <div className={`metric ${evidence.summary.criticalRisk ? "alert" : ""}`}>
            <span className="meta">Critical risk</span>
            <strong>{evidence.summary.criticalRisk}</strong>
          </div>
          <div className="metric">
            <span className="meta">Change events</span>
            <strong>{evidence.summary.historyEvents}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1CriticalItems ? "alert" : ""}`}>
            <span className="meta">M1 critical items</span>
            <strong>{evidence.summary.m1CriticalItems}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1OwnersWithOpenItems ? "alert" : ""}`}>
            <span className="meta">M1 active owners</span>
            <strong>{evidence.summary.m1OwnersWithOpenItems}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1OverdueItems ? "alert" : ""}`}>
            <span className="meta">M1 overdue</span>
            <strong>{evidence.summary.m1OverdueItems}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1GeneratedActions ? "alert" : ""}`}>
            <span className="meta">M1 suggested actions</span>
            <strong>{evidence.summary.m1GeneratedActions}</strong>
          </div>
          <div className={`metric ${evidence.summary.m1ActiveGeneratedActions ? "alert" : ""}`}>
            <span className="meta">M1 active actions</span>
            <strong>{evidence.summary.m1ActiveGeneratedActions}</strong>
          </div>
          <div className="metric">
            <span className="meta">M1 acknowledged actions</span>
            <strong>{evidence.summary.m1ResolvedGeneratedActions}</strong>
          </div>
        </div>
        <p>
          Generated at {evidence.generatedAt}. Synthetic-only planning artifact; not a production clinical, NHS
          integration, or regulatory approval artifact.
        </p>
      </section>

      <section className="report-section">
        <h2>Next 30 Days</h2>
        <div className="list">
          {evidence.nextThirtyDays.map((item) => (
            <div className="row" key={item.phase}>
              <div>
                <strong>
                  {item.month}: {item.deliverable}
                </strong>
                <p>
                  Owner {item.tracker?.owner} · due {item.tracker?.dueDate}
                </p>
                <p>{item.tracker?.notes}</p>
              </div>
              <div className="pill-row">
                {item.tracker ? <span className={`tag ${statusClass[item.tracker.buildStatus]}`}>{statusLabel(item.tracker.buildStatus)}</span> : null}
                {item.tracker ? <span className={`tag ${riskClass[item.tracker.risk]}`}>{item.tracker.risk}</span> : null}
              </div>
            </div>
          ))}
          {!evidence.nextThirtyDays.length ? (
            <div className="row">
              <div>
                <strong>No next-30-day items</strong>
                <p>No active roadmap items are due in the next 30 days.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="report-section">
        <h2>Blocked Or Critical Items</h2>
        <div className="list">
          {evidence.blockedOrCritical.map((item) => (
            <div className="row" key={item.phase}>
              <div>
                <strong>
                  {item.phase}: {item.deliverable}
                </strong>
                <p>{item.currentReality}</p>
                <p>{item.nextBuild}</p>
              </div>
              <div className="pill-row">
                {item.tracker ? <span className={`tag ${statusClass[item.tracker.buildStatus]}`}>{statusLabel(item.tracker.buildStatus)}</span> : null}
                {item.tracker ? <span className={`tag ${riskClass[item.tracker.risk]}`}>{item.tracker.risk}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Budget Readiness</h2>
        <div className="layout-grid">
          <div className="metric">
            <span className="meta">Header budget</span>
            <strong>£{evidence.budget.workbookHeaderBudgetK}K</strong>
          </div>
          <div className="metric">
            <span className="meta">Line-item total</span>
            <strong>£{evidence.budget.workbookLineItemTotalK}K</strong>
          </div>
          <div className="metric alert">
            <span className="meta">Mismatch</span>
            <strong>£{evidence.budget.mismatchK}K</strong>
          </div>
        </div>
        <p>
          Budget must be reconciled before external fundraising, board planning, or hiring decisions rely on this workbook.
        </p>
      </section>

      <section className="report-section">
        <h2>Do Not Claim Yet</h2>
        <div className="list">
          {evidence.doNotClaimYet.map((claim) => (
            <div className="row" key={claim}>
              <div>
                <strong>{claim}</strong>
                <p>Use planned, preparation, rehearsal, or future milestone language only.</p>
              </div>
              <span className="tag danger">not built</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>M1 Execution Checklist</h2>
        <div className="layout-grid">
          <div className="metric">
            <span className="meta">M1 tasks</span>
            <strong>{evidence.m1Checklist.summary.total}</strong>
          </div>
          <div className="metric alert">
            <span className="meta">Critical</span>
            <strong>{evidence.m1Checklist.summary.critical}</strong>
          </div>
          <div className={`metric ${evidence.m1Checklist.summary.not_started ? "alert" : ""}`}>
            <span className="meta">Not started</span>
            <strong>{evidence.m1Checklist.summary.not_started}</strong>
          </div>
        </div>
        <div className="list">
          {evidence.m1Checklist.items.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.week} · owner {item.owner} · due {item.dueDate}
                </p>
                <p>{item.doneWhen}</p>
                <p>{item.notes}</p>
              </div>
              <div className="pill-row">
                <span className={`tag ${statusClass[item.buildStatus]}`}>{statusLabel(item.buildStatus)}</span>
                <span className={`tag ${riskClass[item.risk]}`}>{item.risk}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>M1 Suggested Follow-Up Actions</h2>
        <div className="list">
          {evidence.m1Checklist.generatedActions.map((action) => (
            <div className="row" key={action.id}>
              <div>
                <strong>
                  {action.owner}: {action.title}
                </strong>
                <p>{action.suggestedAction}</p>
                <p>
                  Due {action.dueDate} · reason {action.reason.replaceAll("_", " ")} · evidence {action.evidenceLink || "missing"}
                </p>
                {actionResolutionById.has(action.id) ? (
                  <p>
                    Acknowledged as {actionResolutionById.get(action.id)?.status.replaceAll("_", " ")} by{" "}
                    {actionResolutionById.get(action.id)?.resolvedBy} · {actionResolutionById.get(action.id)?.note || "No note"}
                  </p>
                ) : null}
              </div>
              <span className={`tag ${action.priority === "critical" ? "danger" : action.priority === "high" ? "warn" : ""}`}>
                {action.priority}
              </span>
            </div>
          ))}
          {!evidence.m1Checklist.generatedActions.length ? (
            <div className="row">
              <div>
                <strong>No suggested follow-up actions</strong>
                <p>All M1 items are either built, evidenced, or on track.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="report-section">
        <h2>M1 Due-Date Health</h2>
        <div className="list">
          {evidence.m1Checklist.dueDateHealth.rows.map((row) => (
            <div className="row" key={row.item.id}>
              <div>
                <strong>{row.item.title}</strong>
                <p>
                  Due {row.item.dueDate} · owner {row.item.owner}
                </p>
              </div>
              <span className={`tag ${dueDateStatusClass[row.status]}`}>{formatDueDateStatus(row.status)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>M1 Owner Follow-Up</h2>
        <div className="list">
          {evidence.m1Checklist.ownerFollowUps.map((owner) => (
            <div className="row" key={owner.owner}>
              <div>
                <strong>{owner.owner}</strong>
                <p>
                  {owner.openItems} open · {owner.criticalItems} critical · {owner.missingEvidenceItems} missing evidence links
                </p>
                {owner.nextDueItem ? (
                  <p>
                    Next due: {owner.nextDueItem.title} by {owner.nextDueItem.dueDate}
                  </p>
                ) : (
                  <p>No open owner follow-up.</p>
                )}
              </div>
              <span className={`tag ${owner.criticalItems ? "danger" : owner.openItems ? "warn" : "ok"}`}>
                {owner.criticalItems ? "act first" : owner.openItems ? "follow up" : "clear"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Recent Roadmap Change History</h2>
        <div className="list">
          {evidence.history.recent.map((entry) => (
            <div className="row" key={entry.id}>
              <div>
                <strong>
                  {entry.itemId}: {entry.summary}
                </strong>
                <p>
                  {new Date(entry.changedAt).toLocaleString("en-GB")} · {entry.changedBy}
                </p>
                {entry.changes.map((change) => (
                  <p key={`${entry.id}-${change.field}`}>
                    {change.field}: {change.before || "blank"} {"->"} {change.after || "blank"}
                  </p>
                ))}
              </div>
              <span className="tag">{entry.changes.length} change(s)</span>
            </div>
          ))}
          {!evidence.history.recent.length ? (
            <div className="row">
              <div>
                <strong>No roadmap changes recorded</strong>
                <p>Roadmap tracker edits will appear here after the first update.</p>
              </div>
              <span className="tag warn">empty</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="report-section">
        <h2>Full M1-M12 Status</h2>
        <div className="list">
          {evidence.roadmap.map((item) => (
            <div className="row" key={item.phase}>
              <div>
                <strong>
                  {item.month}: {item.deliverable}
                </strong>
                <p>
                  Owner {item.tracker?.owner} · due {item.tracker?.dueDate} · last updated {item.tracker?.lastUpdated}
                </p>
                <p>{item.tracker?.notes}</p>
              </div>
              <div className="pill-row">
                {item.tracker ? <span className={`tag ${statusClass[item.tracker.buildStatus]}`}>{statusLabel(item.tracker.buildStatus)}</span> : null}
                {item.tracker ? <span className={`tag ${riskClass[item.tracker.risk]}`}>{item.tracker.risk}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
