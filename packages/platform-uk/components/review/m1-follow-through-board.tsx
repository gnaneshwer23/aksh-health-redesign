"use client";

import { useMemo } from "react";

import { buildM1ActionInboxEvidencePayload } from "@/lib/roadmap-evidence";
import { useRoadmapState } from "@/lib/use-roadmap-state";

export function M1FollowThroughBoard() {
  const { state, isLoaded, isSaving, error, resolveM1Action } = useRoadmapState();
  const evidence = useMemo(() => buildM1ActionInboxEvidencePayload(state), [state]);
  const followThroughActions = evidence.acknowledgedActions.filter((action) => action.resolution?.status !== "done" && action.resolution?.status !== "not_needed");

  if (!isLoaded) {
    return <div className="panel">Loading M1 follow-through board...</div>;
  }

  return (
    <div className="layout-grid">
      <section className="span-12 hero-banner stack">
        <span className="hero-kicker">M1 follow-through board</span>
        <div className="actions">
          <a className="button secondary" href="/review/roadmap/actions">
            Action Inbox
          </a>
          <a className="button secondary" href="/review/roadmap/actions/report">
            Action Report
          </a>
          <a className="button secondary" href="/api/roadmap/actions">
            Export Actions JSON
          </a>
        </div>
        <h2>Track what happens after an M1 action is acknowledged.</h2>
        <p>
          Acknowledgement says an owner has seen the action. Follow-through captures the concrete next step, target date,
          blocker, and evidence link so the team can close the loop.
        </p>
        {error ? <div className="panel roadmap-warning">{error}</div> : null}
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Ready follow-through</strong>
            <p>Acknowledged actions with both next step and target date.</p>
            <span className="hero-stat-value">{evidence.summary.followThroughReady}</span>
          </div>
          <div className="hero-stat">
            <strong>Missing next step</strong>
            <p>Acknowledged actions that still need a concrete next step.</p>
            <span className="hero-stat-value">{evidence.summary.missingNextStep}</span>
          </div>
          <div className="hero-stat">
            <strong>Blocked follow-through</strong>
            <p>Acknowledged actions with an explicit blocked reason.</p>
            <span className="hero-stat-value">{evidence.summary.blockedFollowThrough}</span>
          </div>
        </div>
      </section>

      <section className="span-12 panel stack">
        <div className="row">
          <div>
            <h3>Follow-Through Items</h3>
            <p>Only acknowledged actions that are not done or not-needed appear here.</p>
          </div>
          <span className="pill">{followThroughActions.length} open</span>
        </div>
        <div className="list">
          {followThroughActions.map((action) => {
            const resolution = action.resolution;

            if (!resolution) {
              return null;
            }

            return (
              <div className="row" key={action.id}>
                <div>
                  <strong>
                    {action.owner}: {action.title}
                  </strong>
                  <p>
                    Acknowledged as {resolution.status.replaceAll("_", " ")} · due {action.dueDate} · reason{" "}
                    {action.reason.replaceAll("_", " ")}
                  </p>
                  <div className="roadmap-editor">
                    <label className="roadmap-editor__wide">
                      Next step
                      <input
                        defaultValue={resolution.nextStep}
                        disabled={isSaving}
                        onBlur={(event) =>
                          void resolveM1Action({
                            ...resolution,
                            nextStep: event.currentTarget.value
                          })
                        }
                        placeholder="Example: Confirm CSO interview date and update evidence link"
                        type="text"
                      />
                    </label>
                    <label>
                      Target date
                      <input
                        defaultValue={resolution.targetDate}
                        disabled={isSaving}
                        onChange={(event) =>
                          void resolveM1Action({
                            ...resolution,
                            targetDate: event.currentTarget.value
                          })
                        }
                        type="date"
                      />
                    </label>
                    <label className="roadmap-editor__wide">
                      Blocked reason
                      <input
                        defaultValue={resolution.blockedReason}
                        disabled={isSaving}
                        onBlur={(event) =>
                          void resolveM1Action({
                            ...resolution,
                            blockedReason: event.currentTarget.value
                          })
                        }
                        placeholder="Leave blank if unblocked"
                        type="text"
                      />
                    </label>
                    <label className="roadmap-editor__wide">
                      Evidence link
                      <input
                        defaultValue={resolution.followThroughEvidenceLink}
                        disabled={isSaving}
                        onBlur={(event) =>
                          void resolveM1Action({
                            ...resolution,
                            followThroughEvidenceLink: event.currentTarget.value
                          })
                        }
                        placeholder="/review/roadmap/report"
                        type="text"
                      />
                    </label>
                  </div>
                </div>
                <div className="pill-row">
                  <span className={`tag ${resolution.nextStep && resolution.targetDate ? "ok" : "warn"}`}>
                    {resolution.nextStep && resolution.targetDate ? "ready" : "needs detail"}
                  </span>
                  {resolution.blockedReason ? <span className="tag danger">blocked</span> : null}
                </div>
              </div>
            );
          })}
          {!followThroughActions.length ? (
            <div className="row">
              <div>
                <strong>No open follow-through</strong>
                <p>Acknowledge an M1 action as accepted or deferred to begin tracking follow-through.</p>
              </div>
              <span className="tag ok">clear</span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
