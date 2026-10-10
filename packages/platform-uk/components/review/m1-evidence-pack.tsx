"use client";

import { useMemo } from "react";

import { ReportActions } from "@/components/review/report-actions";
import { buildM1EvidencePackPayload } from "@/lib/roadmap-evidence";
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

export function M1EvidencePack() {
  const { state, isLoaded } = useRoadmapState();
  const pack = useMemo(() => buildM1EvidencePackPayload(state), [state]);
  const actionResolutionById = useMemo(
    () => new Map(pack.actionResolutions.map((resolution) => [resolution.actionId, resolution])),
    [pack.actionResolutions]
  );

  if (!isLoaded) {
    return <div className="panel">Loading M1 evidence pack...</div>;
  }

  return (
    <div className="report-page stack">
      <div className="report-header stack">
        <span className="hero-kicker">M1 Execution Evidence Pack</span>
        <ReportActions backHref="/review/roadmap" exportHref="/api/roadmap/m1-pack" />
        <div className="actions">
          <a className="button secondary" href="/review/roadmap/actions">
            M1 Action Inbox
          </a>
          <a className="button secondary" href="/review/roadmap/actions/report">
            M1 Action Report
          </a>
        </div>
        <h1>regional/EU M1 Execution Handoff</h1>
        <p>
          One pack for the immediate April blockers: clinical safety owner, EHR pathway, regulatory support,
          infrastructure decision, validation scope, FHIR rehearsal, hazard logging, and safety committee setup.
        </p>
      </div>

      <section className="report-section">
        <h2>Pack Summary</h2>
        <div className="layout-grid">
          <div className="metric">
            <span className="meta">Checklist items</span>
            <strong>{pack.summary.totalChecklistItems}</strong>
          </div>
          <div className="metric alert">
            <span className="meta">Critical</span>
            <strong>{pack.summary.criticalChecklistItems}</strong>
          </div>
          <div className={`metric ${pack.summary.openChecklistItems ? "alert" : ""}`}>
            <span className="meta">Open</span>
            <strong>{pack.summary.openChecklistItems}</strong>
          </div>
          <div className={`metric ${pack.summary.ownersWithOpenItems ? "alert" : ""}`}>
            <span className="meta">Owners active</span>
            <strong>{pack.summary.ownersWithOpenItems}</strong>
          </div>
          <div className={`metric ${pack.summary.overdueItems ? "alert" : ""}`}>
            <span className="meta">Overdue</span>
            <strong>{pack.summary.overdueItems}</strong>
          </div>
          <div className={`metric ${pack.summary.waitingOnEvidenceItems ? "alert" : ""}`}>
            <span className="meta">Waiting evidence</span>
            <strong>{pack.summary.waitingOnEvidenceItems}</strong>
          </div>
          <div className={`metric ${pack.summary.generatedActions ? "alert" : ""}`}>
            <span className="meta">Suggested actions</span>
            <strong>{pack.summary.generatedActions}</strong>
          </div>
          <div className={`metric ${pack.summary.activeGeneratedActions ? "alert" : ""}`}>
            <span className="meta">Active actions</span>
            <strong>{pack.summary.activeGeneratedActions}</strong>
          </div>
          <div className="metric">
            <span className="meta">Acknowledged actions</span>
            <strong>{pack.summary.resolvedGeneratedActions}</strong>
          </div>
          <div className="metric alert">
            <span className="meta">Budget mismatch</span>
            <strong>£{pack.summary.budgetMismatchK}K</strong>
          </div>
        </div>
        <p>
          Generated at {pack.generatedAt}. Synthetic-only planning artifact; not a production clinical, NHS integration,
          technology assessment, clinical safety case standard, or real-patient-data artifact.
        </p>
      </section>

      <section className="report-section">
        <h2>Suggested Follow-Up Actions</h2>
        <div className="list">
          {pack.generatedActions.map((action) => (
            <div className="row" key={action.id}>
              <div>
                <strong>{action.owner}: {action.title}</strong>
                <p>{action.suggestedAction}</p>
                <p>
                  Due {action.dueDate} · reason {action.reason.replaceAll("_", " ")}
                  {action.evidenceLink ? ` · evidence ${action.evidenceLink}` : " · evidence missing"}
                </p>
                {actionResolutionById.has(action.id) ? (
                  <p>
                    Acknowledged as {actionResolutionById.get(action.id)?.status.replaceAll("_", " ")} by{" "}
                    {actionResolutionById.get(action.id)?.resolvedBy} · {actionResolutionById.get(action.id)?.note || "No note"}
                  </p>
                ) : null}
              </div>
              <span className={`tag ${action.priority === "critical" ? "danger" : action.priority === "high" ? "warn" : "ok"}`}>
                {action.priority}
              </span>
            </div>
          ))}
          {!pack.generatedActions.length ? (
            <div className="row">
              <div>
                <strong>No suggested follow-up actions</strong>
                <p>No overdue, due-this-week, missing-evidence, or critical-risk M1 items are currently active.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="report-section">
        <h2>Due-Date Health</h2>
        <div className="list">
          {pack.dueDateHealth.rows.map((row) => (
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
        <h2>Owner Follow-Up Board</h2>
        <div className="list">
          {pack.ownerFollowUps.map((owner) => (
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
        <h2>Immediate Blockers</h2>
        <div className="list">
          {pack.immediateBlockers.map((item) => (
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
        <h2>Handoff Artifacts</h2>
        <div className="list">
          {pack.handoffArtifacts.map((artifact) => (
            <div className="row" key={artifact.route}>
              <div>
                <strong>{artifact.label}</strong>
                <p>{artifact.purpose}</p>
                <p>{artifact.route}</p>
              </div>
              <a className="button secondary" href={artifact.route}>
                Open
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Full M1 Checklist</h2>
        <div className="list">
          {pack.checklist.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>
                  {item.week} · owner {item.owner} · due {item.dueDate}
                </p>
                <p>{item.doneWhen}</p>
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
        <h2>Known Limitations</h2>
        <div className="list">
          {pack.knownLimitations.map((item) => (
            <div className="row" key={item}>
              <div>
                <strong>{item}</strong>
                <p>Use planned, preparation, rehearsal, or future milestone language only.</p>
              </div>
              <span className="tag danger">not claimable</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section">
        <h2>Recent Changes</h2>
        <div className="list">
          {pack.recentHistory.length ? (
            pack.recentHistory.map((entry) => (
              <div className="row" key={entry.id}>
                <div>
                  <strong>
                    {entry.itemId}: {entry.summary}
                  </strong>
                  <p>
                    {new Date(entry.changedAt).toLocaleString("en-GB")} · {entry.changedBy}
                  </p>
                </div>
                <span className="tag">{entry.changes.length} change(s)</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No changes recorded yet</strong>
                <p>Roadmap and M1 checklist edits will appear here.</p>
              </div>
              <span className="tag warn">empty</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
