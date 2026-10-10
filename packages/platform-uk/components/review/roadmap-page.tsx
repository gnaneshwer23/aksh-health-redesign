"use client";

import { useMemo, useState } from "react";

import {
  budgetLines,
  criticalPathItems,
  deriveM1DueDateHealth,
  deriveM1GeneratedActions,
  deriveM1OwnerFollowUps,
  doNotClaimYet,
  getNextThirtyDayItems,
  mergeRoadmapWithTracker,
  riskLabel,
  statusLabel,
  summarizeM1ActionResolutions,
  summarizeM1Checklist,
  summarizeTrackerState,
  workbookBudgetTotalK,
  workbookHeaderBudgetK,
  type M1ActionResolution,
  type M1ActionResolutionStatus,
  type M1ChecklistItem,
  type RoadmapBuildStatus,
  type RoadmapRisk,
  type RoadmapTrackerItem
} from "@/lib/roadmap";
import { useRoadmapState } from "@/lib/use-roadmap-state";

type RoadmapFilter = "all" | RoadmapBuildStatus | "next_30" | "critical_path" | "budget_risk";

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

const filters: Array<{ label: string; value: RoadmapFilter }> = [
  { label: "All", value: "all" },
  { label: "Next 30 Days", value: "next_30" },
  { label: "Blocked", value: "blocked" },
  { label: "Not Started", value: "not_started" },
  { label: "Partial", value: "partial" },
  { label: "Critical Path", value: "critical_path" },
  { label: "Budget Risk", value: "budget_risk" }
];

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

function StatusTag({ status }: { status: RoadmapBuildStatus }) {
  return <span className={`tag ${statusClass[status]}`}>{statusLabel(status)}</span>;
}

function RiskTag({ risk }: { risk: RoadmapRisk }) {
  return <span className={`tag ${riskClass[risk]}`}>{riskLabel(risk)}</span>;
}

function actionStatusLabel(status: M1ActionResolutionStatus) {
  return status.replaceAll("_", " ");
}

function EditableTrackerFields({
  item,
  disabled,
  onUpdate
}: {
  item: RoadmapTrackerItem;
  disabled: boolean;
  onUpdate: (id: string, updates: Partial<Omit<RoadmapTrackerItem, "id">>) => void;
}) {
  return (
    <div className="roadmap-editor">
      <label>
        Owner
        <input disabled={disabled} onBlur={(event) => onUpdate(item.id, { owner: event.currentTarget.value })} type="text" defaultValue={item.owner} />
      </label>
      <label>
        Due
        <input disabled={disabled} onChange={(event) => onUpdate(item.id, { dueDate: event.currentTarget.value })} type="date" value={item.dueDate} />
      </label>
      <label>
        Status
        <select disabled={disabled} onChange={(event) => onUpdate(item.id, { buildStatus: event.currentTarget.value as RoadmapBuildStatus })} value={item.buildStatus}>
          <option value="built">Built</option>
          <option value="partial">Partial</option>
          <option value="planned">Planned</option>
          <option value="not_started">Not started</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
      <label>
        Risk
        <select disabled={disabled} onChange={(event) => onUpdate(item.id, { risk: event.currentTarget.value as RoadmapRisk })} value={item.risk}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <label className="roadmap-editor__wide">
        Evidence link
        <input disabled={disabled} onBlur={(event) => onUpdate(item.id, { evidenceLink: event.currentTarget.value })} type="text" defaultValue={item.evidenceLink} placeholder="/review/readiness" />
      </label>
      <label className="roadmap-editor__wide">
        Notes
        <textarea disabled={disabled} onBlur={(event) => onUpdate(item.id, { notes: event.currentTarget.value })} defaultValue={item.notes} rows={3} />
      </label>
    </div>
  );
}

function EditableM1ChecklistFields({
  item,
  disabled,
  onUpdate
}: {
  item: M1ChecklistItem;
  disabled: boolean;
  onUpdate: (id: string, updates: Partial<Omit<M1ChecklistItem, "id" | "week" | "title" | "doneWhen">>) => void;
}) {
  return (
    <div className="roadmap-editor">
      <label>
        Owner
        <input disabled={disabled} onBlur={(event) => onUpdate(item.id, { owner: event.currentTarget.value })} type="text" defaultValue={item.owner} />
      </label>
      <label>
        Due
        <input disabled={disabled} onChange={(event) => onUpdate(item.id, { dueDate: event.currentTarget.value })} type="date" value={item.dueDate} />
      </label>
      <label>
        Status
        <select disabled={disabled} onChange={(event) => onUpdate(item.id, { buildStatus: event.currentTarget.value as RoadmapBuildStatus })} value={item.buildStatus}>
          <option value="built">Built</option>
          <option value="partial">Partial</option>
          <option value="planned">Planned</option>
          <option value="not_started">Not started</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
      <label>
        Risk
        <select disabled={disabled} onChange={(event) => onUpdate(item.id, { risk: event.currentTarget.value as RoadmapRisk })} value={item.risk}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <label className="roadmap-editor__wide">
        Evidence link
        <input disabled={disabled} onBlur={(event) => onUpdate(item.id, { evidenceLink: event.currentTarget.value })} type="text" defaultValue={item.evidenceLink} placeholder="/review/readiness" />
      </label>
      <label className="roadmap-editor__wide">
        Notes
        <textarea disabled={disabled} onBlur={(event) => onUpdate(item.id, { notes: event.currentTarget.value })} defaultValue={item.notes} rows={3} />
      </label>
    </div>
  );
}

export function RoadmapPage() {
  const { state, items, m1Checklist, m1ActionResolutions, isLoaded, isSaving, error, updateItem, updateM1ChecklistItem, resolveM1Action, resetState } = useRoadmapState();
  const [filter, setFilter] = useState<RoadmapFilter>("all");
  const mergedItems = useMemo(() => mergeRoadmapWithTracker(items), [items]);
  const nextThirtyDays = useMemo(() => getNextThirtyDayItems(items, new Date("2026-04-29T00:00:00Z")), [items]);
  const summary = useMemo(() => summarizeTrackerState(items), [items]);
  const m1Summary = useMemo(() => summarizeM1Checklist(m1Checklist), [m1Checklist]);
  const m1DueDateHealth = useMemo(() => deriveM1DueDateHealth(m1Checklist, new Date("2026-04-30T00:00:00Z")), [m1Checklist]);
  const m1DueStatusById = useMemo(() => new Map(m1DueDateHealth.rows.map((row) => [row.item.id, row.status])), [m1DueDateHealth]);
  const m1GeneratedActions = useMemo(() => deriveM1GeneratedActions(m1Checklist, new Date("2026-04-30T00:00:00Z")), [m1Checklist]);
  const m1ActionResolutionById = useMemo(
    () => new Map(m1ActionResolutions.map((resolution) => [resolution.actionId, resolution])),
    [m1ActionResolutions]
  );
  const m1ActionResolutionSummary = useMemo(
    () => summarizeM1ActionResolutions(m1GeneratedActions, m1ActionResolutions),
    [m1GeneratedActions, m1ActionResolutions]
  );
  const m1OwnerFollowUps = useMemo(() => deriveM1OwnerFollowUps(m1Checklist), [m1Checklist]);
  const budgetLineTotal = budgetLines.reduce((total, line) => total + line.totalK, 0);
  const currentProofCount = mergedItems.filter((item) => item.tracker?.buildStatus === "built" || item.tracker?.buildStatus === "partial").length;
  const criticalPathIds = new Set(["1A", "1B", "1F", "2A", "2D", "2F"]);
  const visibleItems = mergedItems.filter((item) => {
    const tracker = item.tracker;
    if (!tracker) return false;
    if (filter === "all") return true;
    if (filter === "next_30") return nextThirtyDays.some((nextItem) => nextItem.phase === item.phase);
    if (filter === "critical_path") return criticalPathIds.has(item.phase);
    if (filter === "budget_risk") return tracker.risk === "critical" || tracker.buildStatus === "blocked" || item.budgetK >= 48;
    return tracker.buildStatus === filter;
  });

  return (
    <div className="layout-grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">12-month execution roadmap</span>
        <div className="actions">
          <a className="button secondary" href="/review/readiness">
            Evidence Readiness
          </a>
          <a className="button secondary" href="/review/ops">
            Ops Dashboard
          </a>
          <a className="button secondary" href="/review/benchmarks/report">
            Benchmark Report
          </a>
          <a className="button secondary" href="/review/roadmap/report">
            Roadmap Report
          </a>
          <a className="button secondary" href="/review/roadmap/m1-pack">
            M1 Evidence Pack
          </a>
          <a className="button secondary" href="/review/roadmap/actions">
            M1 Action Inbox
          </a>
          <a className="button secondary" href="/api/roadmap/evidence">
            Export JSON
          </a>
          <button className="button secondary" disabled={isSaving} onClick={() => void resetState()} type="button">
            Reset Tracker
          </button>
        </div>
        <h2>What is built, what is next, and what we must not overclaim.</h2>
        <p>
          This board converts the original 12-month Excel plan into an editable operating tracker. Updates persist to
          local JSON, while the page keeps the synthetic-proof boundary visible.
        </p>
        {error ? <div className="panel roadmap-warning">{error}</div> : null}
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Roadmap items with proof coverage</strong>
            <p>Items that are at least partially supported by the current regional/EU app.</p>
            <span className="hero-stat-value">
              {currentProofCount}/{summary.total}
            </span>
          </div>
          <div className="hero-stat">
            <strong>Blocked or not started</strong>
            <p>External, regulatory, infrastructure, or live-pilot work not yet built.</p>
            <span className="hero-stat-value">{summary.blocked + summary.not_started}</span>
          </div>
          <div className="hero-stat">
            <strong>Workbook budget check</strong>
            <p>
              Header says £{workbookHeaderBudgetK}K; budget lines total £{workbookBudgetTotalK}K.
            </p>
            <span className="hero-stat-value">£{workbookBudgetTotalK - workbookHeaderBudgetK}K gap</span>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack" id="m1-checklist">
        <div className="row">
          <div>
            <h3>Next 30 Days</h3>
            <p>Urgent operating work from today through the next month.</p>
          </div>
          <span className="pill">{nextThirtyDays.length} active</span>
        </div>
        <div className="list">
          {nextThirtyDays.length ? (
            nextThirtyDays.map((item) => (
              <div className="row" key={item.phase}>
                <div>
                  <strong>
                    {item.month}: {item.deliverable}
                  </strong>
                  <p>
                    Due {item.tracker?.dueDate} · Owner {item.tracker?.owner}
                  </p>
                  <p>{item.tracker?.notes}</p>
                </div>
                <div className="pill-row">
                  {item.tracker ? <StatusTag status={item.tracker.buildStatus} /> : null}
                  {item.tracker ? <RiskTag risk={item.tracker.risk} /> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No active next-30-day roadmap work</strong>
                <p>Either immediate items are built, or due dates need to be updated.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>M1 Owner Follow-Up Board</h3>
            <p>Who needs to act first, based on open work, critical risk, due dates, and missing evidence links.</p>
          </div>
          <span className="pill">{m1OwnerFollowUps.filter((owner) => owner.openItems > 0).length} active owners</span>
        </div>
        <div className="roadmap-owner-grid">
          {m1OwnerFollowUps.map((owner) => (
            <article className="roadmap-owner-card" key={owner.owner}>
              <div className="row">
                <div>
                  <strong>{owner.owner}</strong>
                  <p>
                    {owner.openItems} open · {owner.criticalItems} critical · {owner.missingEvidenceItems} missing evidence
                  </p>
                </div>
                <span className={`tag ${owner.criticalItems ? "danger" : owner.openItems ? "warn" : "ok"}`}>
                  {owner.criticalItems ? "act first" : owner.openItems ? "follow up" : "clear"}
                </span>
              </div>
              {owner.nextDueItem ? (
                <div className="roadmap-owner-card__next">
                  <span className="meta">Next due</span>
                  <strong>{owner.nextDueItem.title}</strong>
                  <p>
                    Due {owner.nextDueItem.dueDate} · {statusLabel(owner.nextDueItem.buildStatus)} · {owner.nextDueItem.risk}
                  </p>
                </div>
              ) : (
                <div className="roadmap-owner-card__next">
                  <span className="meta">No open work</span>
                  <strong>Owner is clear</strong>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>M1 Due-Date Health</h3>
            <p>Automatic timing signals for overdue work, this-week follow-up, and missing evidence links.</p>
          </div>
          <div className="pill-row">
            <span className="tag danger">{m1DueDateHealth.counts.overdue} overdue</span>
            <span className="tag warn">{m1DueDateHealth.counts.due_this_week} due this week</span>
            <span className="tag warn">{m1DueDateHealth.counts.waiting_on_evidence} waiting on evidence</span>
          </div>
        </div>
        <div className="roadmap-health-grid">
          {m1DueDateHealth.rows.map((row) => (
            <article className="roadmap-health-card" key={row.item.id}>
              <div>
                <strong>{row.item.title}</strong>
                <p>
                  Due {row.item.dueDate} · owner {row.item.owner}
                </p>
              </div>
              <span className={`tag ${dueDateStatusClass[row.status]}`}>{formatDueDateStatus(row.status)}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>M1 Suggested Follow-Up Actions</h3>
            <p>Generated from overdue, due-this-week, waiting-on-evidence, and critical-risk checklist items.</p>
          </div>
          <div className="pill-row">
            <a className="button secondary" href="/review/roadmap/actions">
              Open inbox
            </a>
            <a className="button secondary" href="/review/roadmap/actions/report">
              Action report
            </a>
            <span className="pill">{m1ActionResolutionSummary.active} active</span>
            <span className="tag ok">{m1ActionResolutionSummary.resolved} acknowledged</span>
          </div>
        </div>
        <div className="list">
          {m1GeneratedActions.length ? (
            m1GeneratedActions.slice(0, 10).map((action) => (
              <div className="row" key={action.id}>
                <div>
                  <strong>{action.owner}: {action.title}</strong>
                  <p>{action.suggestedAction}</p>
                  <p>
                    Due {action.dueDate} · reason {action.reason.replaceAll("_", " ")}
                    {action.evidenceLink ? ` · evidence ${action.evidenceLink}` : " · evidence missing"}
                  </p>
                  {m1ActionResolutionById.has(action.id) ? (
                    <p>
                      Acknowledged as {actionStatusLabel(m1ActionResolutionById.get(action.id)?.status ?? "accepted")} by{" "}
                      {m1ActionResolutionById.get(action.id)?.resolvedBy} · {m1ActionResolutionById.get(action.id)?.note || "No note"}
                    </p>
                  ) : null}
                </div>
                <div className="pill-row">
                  <span className={`tag ${action.priority === "critical" ? "danger" : action.priority === "high" ? "warn" : "ok"}`}>
                    {action.priority}
                  </span>
                  {(["accepted", "done", "deferred", "not_needed"] as M1ActionResolutionStatus[]).map((status) => (
                    <button
                      className="button secondary"
                      disabled={isSaving || !isLoaded}
                      key={`${action.id}-${status}`}
                      onClick={() =>
                        void resolveM1Action({
                          actionId: action.id,
                          itemId: action.itemId,
                          owner: action.owner,
                          status,
                          note: `Action marked ${actionStatusLabel(status)} from the roadmap board.`
                        })
                      }
                      type="button"
                    >
                      {actionStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No generated actions</strong>
                <p>M1 checklist is not currently overdue, missing evidence, due this week, or critical-risk.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          )}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>M1 Execution Checklist</h3>
            <p>Immediate blockers from the 12-month workbook: clinical safety, EHR, regulatory, infrastructure, and validation scope.</p>
          </div>
          <div className="pill-row">
            <span className="pill">{m1Summary.total} tasks</span>
            <span className="tag danger">{m1Summary.critical} critical</span>
            <span className="tag warn">{m1Summary.not_started} not started</span>
          </div>
        </div>
        <div className="roadmap-checklist-grid">
          {m1Checklist.map((item) => (
            <article className="roadmap-checklist-card" key={item.id}>
              <div className="row">
                <div>
                  <span className="meta">{item.week}</span>
                  <strong>{item.title}</strong>
                  <p>{item.doneWhen}</p>
                </div>
                <div className="pill-row">
                  <StatusTag status={item.buildStatus} />
                  <RiskTag risk={item.risk} />
                  <span className={`tag ${dueDateStatusClass[m1DueStatusById.get(item.id) ?? "on_track"]}`}>
                    {formatDueDateStatus(m1DueStatusById.get(item.id) ?? "on_track")}
                  </span>
                </div>
              </div>
              <EditableM1ChecklistFields disabled={isSaving || !isLoaded} item={item} onUpdate={(id, updates) => void updateM1ChecklistItem(id, updates)} />
            </article>
          ))}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Roadmap Status</h3>
            <p>
              Current persisted tracker state. Last saved: {isLoaded ? state.updatedAt : "loading"}
              {isSaving ? " · saving" : ""}
            </p>
          </div>
          <span className="pill">Synthetic proof boundary</span>
        </div>
        <div className="roadmap-status-grid">
          <div className="roadmap-status-card">
            <strong>{summary.built}</strong>
            <span>built</span>
          </div>
          <div className="roadmap-status-card">
            <strong>{summary.partial}</strong>
            <span>partial</span>
          </div>
          <div className="roadmap-status-card">
            <strong>{summary.planned}</strong>
            <span>planned</span>
          </div>
          <div className="roadmap-status-card">
            <strong>{summary.not_started}</strong>
            <span>not started</span>
          </div>
          <div className="roadmap-status-card danger">
            <strong>{summary.blocked}</strong>
            <span>blocked</span>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Roadmap Change History</h3>
            <p>Audit trail for status, owner, risk, due-date, evidence-link, and note changes.</p>
          </div>
          <span className="pill">{state.history.length} events</span>
        </div>
        <div className="roadmap-history-list">
          {state.history.length ? (
            state.history.slice(0, 8).map((entry) => (
              <article className="roadmap-history-card" key={entry.id}>
                <div>
                  <strong>
                    {entry.itemId}: {entry.summary}
                  </strong>
                  <p>
                    {new Date(entry.changedAt).toLocaleString("en-GB")} · {entry.changedBy}
                  </p>
                </div>
                <div className="roadmap-history-card__changes">
                  {entry.changes.map((change) => (
                    <span key={`${entry.id}-${change.field}`}>
                      {change.field}: {change.before || "blank"} {"->"} {change.after || "blank"}
                    </span>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No roadmap changes recorded yet</strong>
                <p>Update any editable roadmap field to start the audit trail.</p>
              </div>
              <span className="tag warn">empty</span>
            </div>
          )}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Month-by-Month Build Gap</h3>
            <p>Filter the roadmap by operational risk or build status, then update ownership and evidence fields inline.</p>
          </div>
          <div className="roadmap-filter-row">
            {filters.map((item) => (
              <button className={`roadmap-filter${filter === item.value ? " is-active" : ""}`} key={item.value} onClick={() => setFilter(item.value)} type="button">
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="roadmap-table">
          <div className="roadmap-table__head">
            <span>Month</span>
            <span>Deliverable</span>
            <span>Current reality</span>
            <span>Tracker</span>
            <span>Status</span>
          </div>
          {visibleItems.map((item) => (
            <article className="roadmap-table__row" key={item.phase}>
              <div>
                <strong>{item.month}</strong>
                <p>
                  Phase {item.phase} · £{item.budgetK}K · {item.team} FTE
                </p>
              </div>
              <div>
                <strong>{item.deliverable}</strong>
                <p>{item.validationGate}</p>
                <p>{item.nextBuild}</p>
              </div>
              <p>{item.currentReality}</p>
              {item.tracker ? (
                <EditableTrackerFields disabled={isSaving || !isLoaded} item={item.tracker} onUpdate={(id, updates) => void updateItem(id, updates)} />
              ) : (
                <p>No tracker state available.</p>
              )}
              <div className="pill-row">
                {item.tracker ? <StatusTag status={item.tracker.buildStatus} /> : null}
                {item.tracker ? <RiskTag risk={item.tracker.risk} /> : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="span-7 panel stack">
        <h3>Critical Path</h3>
        <div className="list">
          {criticalPathItems.map((item) => (
            <div className="row" key={`${item.timeline}-${item.blocker}`}>
              <div>
                <strong>
                  {item.timeline}: {item.blocker}
                </strong>
                <p>
                  Owner: {item.owner}. Impact: {item.impact}
                </p>
                <p>{item.currentReality}</p>
              </div>
              <StatusTag status={item.buildStatus} />
            </div>
          ))}
        </div>
      </div>

      <div className="span-5 panel stack">
        <h3>Do Not Claim Yet</h3>
        <p>These are roadmap goals, not current product capabilities.</p>
        <div className="list">
          {doNotClaimYet.map((claim) => (
            <div className="row" key={claim}>
              <div>
                <strong>{claim}</strong>
                <p>Keep language as planned, preparation, rehearsal, or future milestone.</p>
              </div>
              <span className="tag danger">not built</span>
            </div>
          ))}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Budget Readiness</h3>
            <p>Grouped from the workbook budget sheet and mapped to build reality.</p>
          </div>
          <span className="tag warn">
            Header/list mismatch: £{workbookHeaderBudgetK}K vs £{workbookBudgetTotalK}K
          </span>
        </div>
        <div className="roadmap-budget-grid">
          {budgetLines.map((line) => (
            <article className="roadmap-budget-card" key={`${line.category}-${line.item}`}>
              <div className="row">
                <div>
                  <strong>{line.category}</strong>
                  <p>{line.item}</p>
                </div>
                <StatusTag status={line.buildStatus} />
              </div>
              <div className="roadmap-budget-card__metrics">
                <span>£{line.totalK}K total</span>
                <span>£{line.monthlyK}K/month</span>
              </div>
            </article>
          ))}
        </div>
        <div className="panel roadmap-warning">
          <strong>Budget cleanup needed before external use</strong>
          <p>
            The workbook header says £{workbookHeaderBudgetK}K, but the line-item budget totals £{budgetLineTotal}K.
            Before this is used in fundraising, board planning, or hiring, the financial model should be reconciled.
          </p>
        </div>
      </div>
    </div>
  );
}
