"use client";

import { useMemo } from "react";

import { ReportActions } from "@/components/review/report-actions";
import { buildM1ActionInboxEvidencePayload } from "@/lib/roadmap-evidence";
import { useRoadmapState } from "@/lib/use-roadmap-state";

const priorityClass = {
  critical: "danger",
  high: "warn",
  medium: "ok"
} as const;

export function M1ActionReport() {
  const { state, isLoaded } = useRoadmapState();
  const evidence = useMemo(() => buildM1ActionInboxEvidencePayload(state), [state]);

  if (!isLoaded) {
    return <div className="panel">Loading M1 action report...</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">M1 Action Evidence</span>
        <ReportActions backHref="/review/roadmap/actions" exportHref="/api/roadmap/actions" />
        <h1>UK/EU M1 Owner Action Report</h1>
        <p>
          Printable owner follow-up artifact for the current M1 action inbox. This is an internal synthetic-proof
          operating report, not a formal programme approval or clinical deployment record.
        </p>
        <div className="actions">
          <a className="button secondary" href="/review/roadmap">
            Roadmap Tracker
          </a>
          <a className="button secondary" href="/review/roadmap/m1-pack">
            M1 Evidence Pack
          </a>
          <a className="button secondary" href="/review/roadmap/follow-through">
            Follow-Through Board
          </a>
        </div>
      </div>

      <section className="report-section">
        <h2>Action Summary</h2>
        <div className="grid">
          <div className="metric">
            <span className="meta">Generated</span>
            <strong>{evidence.summary.generated}</strong>
          </div>
          <div className={`metric ${evidence.summary.active ? "alert" : ""}`}>
            <span className="meta">Active</span>
            <strong>{evidence.summary.active}</strong>
          </div>
          <div className="metric">
            <span className="meta">Acknowledged</span>
            <strong>{evidence.summary.resolved}</strong>
          </div>
          <div className={`metric ${evidence.summary.criticalActive ? "alert" : ""}`}>
            <span className="meta">Critical active</span>
            <strong>{evidence.summary.criticalActive}</strong>
          </div>
          <div className={`metric ${evidence.summary.missingEvidenceActive ? "alert" : ""}`}>
            <span className="meta">Missing evidence active</span>
            <strong>{evidence.summary.missingEvidenceActive}</strong>
          </div>
          <div className="metric">
            <span className="meta">Owners</span>
            <strong>{evidence.summary.owners}</strong>
          </div>
          <div className={`metric ${evidence.summary.missingNextStep || evidence.summary.missingTargetDate ? "alert" : ""}`}>
            <span className="meta">Follow-through ready</span>
            <strong>{evidence.summary.followThroughReady}</strong>
          </div>
          <div className={`metric ${evidence.summary.blockedFollowThrough ? "alert" : ""}`}>
            <span className="meta">Blocked follow-through</span>
            <strong>{evidence.summary.blockedFollowThrough}</strong>
          </div>
        </div>
        <p>
          Generated at {evidence.generatedAt}. Synthetic-only planning artifact; not production clinical software or live
          NHS integration.
        </p>
      </section>

      <section className="report-section">
        <h2>Owner Groups</h2>
        <div className="list">
          {evidence.ownerGroups.map((group) => (
            <div className="row" key={group.owner}>
              <div>
                <strong>{group.owner}</strong>
                <p>
                  {group.active} active · {group.acknowledged} acknowledged · {group.criticalActive} critical active
                </p>
              </div>
              <span className={`tag ${group.criticalActive ? "danger" : group.active ? "warn" : "ok"}`}>
                {group.criticalActive ? "act first" : group.active ? "follow up" : "clear"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Active Actions</h2>
        <div className="list">
          {evidence.activeActions.map((action) => (
            <div className="row" key={action.id}>
              <div>
                <strong>
                  {action.owner}: {action.title}
                </strong>
                <p>{action.suggestedAction}</p>
                <p>
                  Due {action.dueDate} · reason {action.reason.replaceAll("_", " ")}
                  {action.evidenceLink ? ` · evidence ${action.evidenceLink}` : " · evidence missing"}
                </p>
              </div>
              <span className={`tag ${priorityClass[action.priority]}`}>{action.priority}</span>
            </div>
          ))}
          {!evidence.activeActions.length ? (
            <div className="row">
              <div>
                <strong>No active actions</strong>
                <p>All generated M1 actions have been acknowledged.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="report-section">
        <h2>Acknowledged Actions</h2>
        <div className="list">
          {evidence.acknowledgedActions.map((action) => (
            <div className="row" key={action.id}>
              <div>
                <strong>
                  {action.owner}: {action.title}
                </strong>
                <p>
                  {action.resolution?.status.replaceAll("_", " ")} by {action.resolution?.resolvedBy} ·{" "}
                  {action.resolution?.note || "No note"}
                </p>
                <p>
                  Due {action.dueDate} · reason {action.reason.replaceAll("_", " ")}
                </p>
                <p>
                  Next step: {action.resolution?.nextStep || "missing"} · target {action.resolution?.targetDate || "missing"}
                  {action.resolution?.blockedReason ? ` · blocked: ${action.resolution.blockedReason}` : ""}
                </p>
              </div>
              <span className="tag ok">acknowledged</span>
            </div>
          ))}
          {!evidence.acknowledgedActions.length ? (
            <div className="row">
              <div>
                <strong>No acknowledged actions</strong>
                <p>Acknowledgements from the M1 action inbox will appear here.</p>
              </div>
              <span className="tag warn">empty</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
