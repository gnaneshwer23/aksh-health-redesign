"use client";

import { useMemo, useState } from "react";

import {
  deriveM1GeneratedActions,
  summarizeM1ActionResolutions,
  type M1ActionResolutionStatus,
  type M1GeneratedAction
} from "@/lib/roadmap";
import { useRoadmapState } from "@/lib/use-roadmap-state";

type InboxFilter = "active" | "acknowledged" | "all";

const priorityClass: Record<M1GeneratedAction["priority"], string> = {
  critical: "danger",
  high: "warn",
  medium: "ok"
};

function actionStatusLabel(status: M1ActionResolutionStatus) {
  return status.replaceAll("_", " ");
}

function reasonLabel(reason: M1GeneratedAction["reason"]) {
  return reason.replaceAll("_", " ");
}

export function M1ActionInbox() {
  const { m1Checklist, m1ActionResolutions, isLoaded, isSaving, error, resolveM1Action } = useRoadmapState();
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<InboxFilter>("active");
  const generatedActions = useMemo(() => deriveM1GeneratedActions(m1Checklist, new Date("2026-04-30T00:00:00Z")), [m1Checklist]);
  const resolutionById = useMemo(
    () => new Map(m1ActionResolutions.map((resolution) => [resolution.actionId, resolution])),
    [m1ActionResolutions]
  );
  const summary = useMemo(
    () => summarizeM1ActionResolutions(generatedActions, m1ActionResolutions),
    [generatedActions, m1ActionResolutions]
  );
  const followThroughReadyCount = useMemo(
    () => m1ActionResolutions.filter((resolution) => resolution.nextStep && resolution.targetDate).length,
    [m1ActionResolutions]
  );
  const owners = useMemo(() => ["all", ...Array.from(new Set(generatedActions.map((action) => action.owner))).sort()], [generatedActions]);
  const visibleActions = generatedActions.filter((action) => {
    const isAcknowledged = resolutionById.has(action.id);
    if (ownerFilter !== "all" && action.owner !== ownerFilter) return false;
    if (statusFilter === "active") return !isAcknowledged;
    if (statusFilter === "acknowledged") return isAcknowledged;
    return true;
  });

  if (!isLoaded) {
    return <div className="panel">Loading M1 action inbox...</div>;
  }

  return (
    <div className="grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">M1 action inbox</span>
        <div className="actions">
          <a className="button secondary" href="/review/roadmap">
            Roadmap Tracker
          </a>
          <a className="button secondary" href="/review/roadmap/m1-pack">
            M1 Evidence Pack
          </a>
          <a className="button secondary" href="/review/roadmap/actions/report">
            Action Report
          </a>
          <a className="button secondary" href="/review/roadmap/follow-through">
            Follow-Through
          </a>
          <a className="button secondary" href="/api/roadmap/actions">
            Export Actions JSON
          </a>
        </div>
        <h2>Owner-facing follow-ups from the M1 execution plan.</h2>
        <p>
          This inbox turns generated roadmap signals into a short operating queue. It stays synthetic-proof-first:
          acknowledgements are local evidence for internal follow-through, not a formal project-management approval flow.
        </p>
        {error ? <div className="panel roadmap-warning">{error}</div> : null}
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Generated</strong>
            <p>Total suggested owner actions from the current checklist.</p>
            <span className="hero-stat-value">{summary.generated}</span>
          </div>
          <div className="hero-stat">
            <strong>Active</strong>
            <p>Actions still needing acknowledgement.</p>
            <span className="hero-stat-value">{summary.active}</span>
          </div>
          <div className="hero-stat">
            <strong>Acknowledged</strong>
            <p>Accepted, done, deferred, or marked not needed.</p>
            <span className="hero-stat-value">{summary.resolved}</span>
          </div>
          <div className="hero-stat">
            <strong>Follow-through ready</strong>
            <p>Acknowledged actions with next step and target date.</p>
            <span className="hero-stat-value">{followThroughReadyCount}</span>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Inbox Filters</h3>
            <p>Start with active work, then narrow by owner when preparing follow-up.</p>
          </div>
          <span className="pill">{visibleActions.length} showing</span>
        </div>
        <div className="roadmap-filter-row">
          {(["active", "acknowledged", "all"] as InboxFilter[]).map((filter) => (
            <button className={`roadmap-filter${statusFilter === filter ? " is-active" : ""}`} key={filter} onClick={() => setStatusFilter(filter)} type="button">
              {filter}
            </button>
          ))}
        </div>
        <div className="roadmap-filter-row">
          {owners.map((owner) => (
            <button className={`roadmap-filter${ownerFilter === owner ? " is-active" : ""}`} key={owner} onClick={() => setOwnerFilter(owner)} type="button">
              {owner === "all" ? "All owners" : owner}
            </button>
          ))}
        </div>
      </div>

      <div className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Action Queue</h3>
            <p>Each acknowledgement writes back to roadmap state and appears in exports, reports, and audit history.</p>
          </div>
          <div className="pill-row">
            <span className="tag danger">{summary.accepted} accepted</span>
            <span className="tag ok">{summary.done} done</span>
            <span className="tag warn">{summary.deferred} deferred</span>
            <span className="tag">{summary.not_needed} not needed</span>
          </div>
        </div>
        <div className="list">
          {visibleActions.map((action) => {
            const resolution = resolutionById.get(action.id);

            return (
              <div className="row" key={action.id}>
                <div>
                  <strong>
                    {action.owner}: {action.title}
                  </strong>
                  <p>{action.suggestedAction}</p>
                  <p>
                    Due {action.dueDate} · reason {reasonLabel(action.reason)}
                    {action.evidenceLink ? ` · evidence ${action.evidenceLink}` : " · evidence missing"}
                  </p>
                  {resolution ? (
                    <p>
                      Acknowledged as {actionStatusLabel(resolution.status)} by {resolution.resolvedBy} · {resolution.note || "No note"}
                    </p>
                  ) : (
                    <p>Not acknowledged yet.</p>
                  )}
                </div>
                <div className="pill-row">
                  <span className={`tag ${priorityClass[action.priority]}`}>{action.priority}</span>
                  {(["accepted", "done", "deferred", "not_needed"] as M1ActionResolutionStatus[]).map((status) => (
                    <button
                      className="button secondary"
                      disabled={isSaving}
                      key={`${action.id}-${status}`}
                      onClick={() =>
                        void resolveM1Action({
                          actionId: action.id,
                          itemId: action.itemId,
                          owner: action.owner,
                          status,
                          note: `Action marked ${actionStatusLabel(status)} from the M1 action inbox.`
                        })
                      }
                      type="button"
                    >
                      {actionStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {!visibleActions.length ? (
            <div className="row">
              <div>
                <strong>No actions match this filter</strong>
                <p>Try all owners or all statuses, or update the M1 checklist to generate new follow-up work.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
