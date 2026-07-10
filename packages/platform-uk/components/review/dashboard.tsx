"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { useDashboardSummary } from "@/lib/use-dashboard-summary";

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function Dashboard() {
  const { data: session } = useSession();
  const { summary, isLoaded, error } = useDashboardSummary();
  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || "Clinician";

  if (!isLoaded) {
    return <div className="panel">Loading your workspace...</div>;
  }

  if (error || !summary) {
    return <div className="panel">{error ?? "Failed to load workspace summary."}</div>;
  }

  const heroMessage =
    summary.overview.urgentCount > 0
      ? `${summary.overview.urgentCount} cases need attention before they are safe to progress.`
      : "No urgent blockers are active. You can progress the next review with confidence.";

  return (
    <div className="stack workspace-page">
      <section className="workspace-overview panel">
        <div className="workspace-overview__copy">
          <p className="workspace-overview__eyebrow">Personal workspace</p>
          <h2>{displayName}, here is your clinical workload.</h2>
          <p>{heroMessage}</p>
          <div className="workspace-persona-note">
            <span className="pill">{summary.persona.title}</span>
            <p>{summary.persona.focus}</p>
          </div>
        </div>

        <div className="workspace-overview__actions actions">
          <Link className="button primary" href="/review">
            Open active queue
          </Link>
          <Link className="button secondary" href="/intake">
            Start new intake
          </Link>
          <Link className="button secondary" href="/review/summary">
            Session summary
          </Link>
        </div>
      </section>

      <section className="grid workspace-metrics">
        <article className="span-4 workspace-metric-card">
          <span className="workspace-metric-card__label">Pending reviews</span>
          <strong>{summary.overview.pendingCount}</strong>
          <p>Cases still waiting for your next decision.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--alert">
          <span className="workspace-metric-card__label">Urgent items</span>
          <strong>{summary.overview.urgentCount}</strong>
          <p>High-risk, blocked, or overdue follow-ups needing immediate review.</p>
        </article>
        <article className="span-4 workspace-metric-card">
          <span className="workspace-metric-card__label">Completion rate</span>
          <strong>{summary.overview.completionRate}%</strong>
          <p>Acceptance performance across your current workspace.</p>
        </article>
        <article className="span-4 workspace-metric-card">
          <span className="workspace-metric-card__label">Accepted cases</span>
          <strong>{summary.overview.acceptedCount}</strong>
          <p>Reviewed records already finalized and ready for downstream evidence use.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--warn">
          <span className="workspace-metric-card__label">Blocked cases</span>
          <strong>{summary.overview.blockedCount}</strong>
          <p>Items that cannot be accepted until structural issues are resolved.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--warn">
          <span className="workspace-metric-card__label">Follow-up load</span>
          <strong>{summary.overview.followUpCount}</strong>
          <p>Cases carrying stakeholder concerns, actions, or readiness issues.</p>
        </article>
        <article className="span-4 workspace-metric-card">
          <span className="workspace-metric-card__label">Ready to finalize</span>
          <strong>{summary.productivity.readyToFinalizeCount}</strong>
          <p>Cases that can move forward without active blockers or high-risk flags.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--alert">
          <span className="workspace-metric-card__label">High-risk reviews</span>
          <strong>{summary.productivity.highRiskCount}</strong>
          <p>Items that still require closer clinical scrutiny before progression.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--warn">
          <span className="workspace-metric-card__label">Overdue follow-ups</span>
          <strong>{summary.productivity.overdueFollowUps}</strong>
          <p>Open actions whose due dates have already passed.</p>
        </article>
        <article className="span-4 workspace-metric-card">
          <span className="workspace-metric-card__label">Promoted cases</span>
          <strong>{summary.productivity.promotedCount}</strong>
          <p>Cases explicitly moved forward during internal meeting review.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--warn">
          <span className="workspace-metric-card__label">Needs evidence</span>
          <strong>{summary.productivity.needsEvidenceCount}</strong>
          <p>Cases still waiting on stronger evidence before promotion can continue.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--warn">
          <span className="workspace-metric-card__label">Carryover work</span>
          <strong>{summary.productivity.carryoverCount}</strong>
          <p>Held or remediation-carried cases that still need explicit follow-through.</p>
        </article>
        <article className="span-4 workspace-metric-card workspace-metric-card--alert">
          <span className="workspace-metric-card__label">Overdue meeting actions</span>
          <strong>{summary.productivity.overdueMeetingActions}</strong>
          <p>Meeting-driven actions that have passed their follow-through target window.</p>
        </article>
      </section>

      <section className="grid">
        <div className="span-7 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">What to do next</p>
              <h2>Priority queue</h2>
            </div>
            <Link className="button secondary" href="/review?filter=blocked">
              Open blocked
            </Link>
          </div>

          <div className="workspace-priority-list">
            {summary.priorities.map((item) => (
              <article className="workspace-priority-card" key={item.caseId}>
                <div className="workspace-priority-card__main">
                  <div className="workspace-priority-card__title-row">
                    <strong>{item.patientLabel}</strong>
                    <span className={`tag ${item.highRisk ? "danger" : item.blockerCount > 0 ? "warn" : "ok"}`}>
                      {item.highRisk ? "high risk" : item.blockerCount > 0 ? "blocked" : formatStatus(item.status)}
                    </span>
                  </div>
                  <p>{item.reason}</p>
                </div>
                <div className="workspace-priority-card__actions actions">
                  <a className="button secondary" href={item.href}>
                    Open case
                  </a>
                  <a className="button secondary" href={`${item.href}/evidence`}>
                    Evidence
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="span-5 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">Operational ownership</p>
              <h2>Follow-up board</h2>
            </div>
            <Link className="button secondary" href="/review?filter=follow-up">
              Open follow-up
            </Link>
          </div>

          <div className="workspace-follow-up-list">
            {summary.followUps.length ? (
              summary.followUps.map((item) => (
                <article className="workspace-follow-up-card" key={item.caseId}>
                  <div>
                    <strong>{item.patientLabel}</strong>
                    <p>
                      {item.owner ? `Owner: ${item.owner}` : "No owner assigned"}
                      {item.dueDate ? ` • Due ${item.dueDate}` : " • No due date"}
                    </p>
                  </div>
                  <div className="workspace-follow-up-card__meta">
                    <span className={`tag ${item.overdue ? "danger" : "warn"}`}>
                      {item.overdue ? "overdue" : `${item.openSessions} open`}
                    </span>
                    <a className="button secondary" href={item.href}>
                      Review
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No active follow-ups</strong>
                  <p>Your current workspace has no unresolved follow-up ownership to clear.</p>
                </div>
                <span className="tag ok">clear</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="span-8 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">Recent activity</p>
              <h2>Recently updated cases</h2>
            </div>
            <Link className="button secondary" href="/review">
              Open all cases
            </Link>
          </div>

          <div className="workspace-recent-grid">
            {summary.recentCases.map((item) => (
              <article className="workspace-recent-card" key={item.caseId}>
                <div className="workspace-recent-card__top">
                  <strong>{item.patientLabel}</strong>
                  <span className={`tag ${item.highRisk ? "danger" : item.blockerCount > 0 ? "warn" : "ok"}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>
                <p>{item.summary}</p>
                <div className="workspace-recent-card__footer">
                  <span>Updated {item.updatedAt}</span>
                  <a href={`/cases/${item.caseId}`}>Open</a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="span-4 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">Meeting follow-through</p>
              <h2>Outcome board</h2>
            </div>
            <Link className="button secondary" href="/review/meeting-packet">
              Open packet
            </Link>
          </div>

          <div className="workspace-follow-up-list">
            {summary.meetingFollowThrough.length ? (
              summary.meetingFollowThrough.map((item) => (
                <article className="workspace-follow-up-card" key={item.caseId}>
                  <div>
                    <strong>{item.patientLabel}</strong>
                    <p>{item.dispositionLabel}</p>
                    <p>{item.owner ? `Owner: ${item.owner}` : "Owner: unassigned"}</p>
                    <p>{item.note ?? item.detail}</p>
                  </div>
                  <div className="workspace-follow-up-card__meta">
                    <span className={`tag ${item.dispositionLabel === "Promoted" ? "ok" : "warn"}`}>
                      {item.dispositionLabel.toLowerCase()}
                    </span>
                    <a className="button secondary" href={item.href}>
                      Review
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No meeting outcomes yet</strong>
                  <p>The workspace does not yet have captured meeting follow-through to show here.</p>
                </div>
                <span className="tag ok">clear</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="span-8 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">Outcome-driven automation</p>
              <h2>Next action cards</h2>
            </div>
            <Link className="button secondary" href="/review/meeting-packet">
              Open packet
            </Link>
          </div>

          <div className="workspace-priority-list">
            {summary.meetingNextActions.length ? (
              summary.meetingNextActions.map((item) => (
                <article className="workspace-priority-card" key={item.caseId}>
                  <div className="workspace-priority-card__main">
                    <div className="workspace-priority-card__title-row">
                      <strong>{item.patientLabel}</strong>
                      <span className={`tag ${item.slaLabel === "Overdue" ? "danger" : item.dispositionLabel === "Promoted" ? "ok" : "warn"}`}>
                        {item.dispositionLabel.toLowerCase()}
                      </span>
                    </div>
                    <p>{item.title}</p>
                    <p>{item.owner ? `Owner: ${item.owner}` : "Owner: unassigned"}</p>
                    <p>{item.detail}</p>
                    <p>
                      {item.slaLabel} · {item.ageDays} day(s) old
                    </p>
                    <p>{item.slaDetail}</p>
                  </div>
                  <div className="workspace-priority-card__actions actions">
                    <a className="button secondary" href={item.href}>
                      {item.actionLabel}
                    </a>
                    <a className="button secondary" href={`/cases/${item.caseId}`}>
                      Open case
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="row">
                <div>
                  <strong>No outcome-driven actions yet</strong>
                  <p>Capture meeting outcomes to generate explicit next-action cards here.</p>
                </div>
                <span className="tag ok">idle</span>
              </div>
            )}
          </div>
        </div>

        <div className="span-4 panel stack">
          <div className="workspace-section-head">
            <div>
              <p className="meta">Pipeline shape</p>
              <h2>Workstreams</h2>
            </div>
          </div>

          <div className="workspace-workstream-list">
            {summary.workstreams.map((item) => (
              <div className="workspace-workstream-row" key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.count} cases in this stream.</p>
                </div>
                <span className="workspace-workstream-row__count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
