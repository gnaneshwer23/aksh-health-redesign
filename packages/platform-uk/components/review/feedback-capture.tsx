"use client";

import { useMemo, useState } from "react";

import { isFeedbackEntryOverdue } from "@/lib/feedback-insights";
import { useFeedbackState } from "@/lib/use-feedback-state";

const audiencePrompts = {
  Product: "What part of the workflow felt most differentiated versus a generic AI scribe?",
  Clinical: "Where did the clinical safety story feel strongest or weakest?",
  Regulatory: "Which governance or evidence control felt most convincing, and what still felt under-specified?"
} as const;

const scenarioOptions = [
  { value: "", label: "No linked case" },
  { value: "case-001", label: "case-001 · High-risk respiratory medication case" },
  { value: "case-002", label: "case-002 · Blocked hypertension follow-up" },
  { value: "case-003", label: "case-003 · Straightforward eczema review" },
  { value: "case-004", label: "case-004 · Override-path lipid review" },
  { value: "case-005", label: "case-005 · Accepted frozen artifact" }
] as const;

type Audience = keyof typeof audiencePrompts;
type FeedbackEntry = ReturnType<typeof useFeedbackState>["archive"][number];

function collectTopPhrases(entries: FeedbackEntry[], selector: (entry: FeedbackEntry) => string) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const value = selector(entry).trim();
    if (!value) {
      continue;
    }

    const normalized = value
      .replace(/\s+/g, " ")
      .split(/[.!?;\n]/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 12);

    for (const phrase of normalized) {
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);
}

export function FeedbackCapture({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const dashboardHref = `/${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const pilotHref = `/review/pilot${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const rehearsalHref = `/review/rehearsal${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const presenterHref = `/review/presenter${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;
  const {
    draft,
    archive,
    isLoaded,
    isSaving,
    error,
    updateDraftField,
    saveSession,
    clearArchive,
    resetDraftNotes,
    updateResolution,
    updateFollowUp
  } =
    useFeedbackState();
  const [archiveAudienceFilter, setArchiveAudienceFilter] = useState<Audience | "All">("All");
  const [archiveReadinessFilter, setArchiveReadinessFilter] = useState<"All" | "High" | "Needs work">("All");
  const [archiveQuery, setArchiveQuery] = useState("");
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<string, { followUpOwner: string; dueDate: string; nextCheckpoint: string; overdueNote: string }>>({});

  const exportPayload = useMemo(
    () => ({
      ...draft
    }),
    [draft]
  );

  const archiveSummary = useMemo(() => {
    const total = archive.length;
    const strongCount = archive.filter((entry) => Number(entry.readinessScore) >= 4).length;
    const resolvedCount = archive.filter((entry) => entry.resolutionStatus === "resolved").length;
    const latest = archive[0]?.savedAt ?? "No saved sessions yet";

    return { total, strongCount, resolvedCount, latest };
  }, [archive]);

  const filteredArchive = useMemo(() => {
    return archive.filter((entry) => {
      if (archiveAudienceFilter !== "All" && entry.audience !== archiveAudienceFilter) {
        return false;
      }

      if (archiveReadinessFilter === "High" && Number(entry.readinessScore) < 4) {
        return false;
      }

      if (archiveReadinessFilter === "Needs work" && Number(entry.readinessScore) >= 4) {
        return false;
      }

      if (!archiveQuery.trim()) {
        return true;
      }

      const haystack = [
        entry.audience,
        entry.sessionType,
        entry.strongestMoment,
        entry.confusionPoint,
        entry.objections,
        entry.nextActions
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(archiveQuery.trim().toLowerCase());
    });
  }, [archive, archiveAudienceFilter, archiveQuery, archiveReadinessFilter]);

  const insightSummary = useMemo(
    () => ({
      strongestMoments: collectTopPhrases(archive, (entry) => entry.strongestMoment),
      objections: collectTopPhrases(archive, (entry) => entry.objections || entry.confusionPoint),
      nextActions: collectTopPhrases(archive, (entry) => entry.nextActions)
    }),
    [archive]
  );

  const filteredInsightSummary = useMemo(
    () => ({
      strongestMoments: collectTopPhrases(filteredArchive, (entry) => entry.strongestMoment),
      objections: collectTopPhrases(filteredArchive, (entry) => entry.objections || entry.confusionPoint),
      nextActions: collectTopPhrases(filteredArchive, (entry) => entry.nextActions)
    }),
    [filteredArchive]
  );

  function handleExport() {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `feedback-${draft.audience.toLowerCase()}-${draft.sessionType.toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleArchiveExport() {
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedback-archive.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFilteredSummaryExport() {
    const summaryPayload = {
      filters: {
        audience: archiveAudienceFilter,
        readiness: archiveReadinessFilter,
        query: archiveQuery
      },
      generatedAt: new Date().toLocaleString("en-GB"),
      totals: {
        matchingSessions: filteredArchive.length,
        highReadinessSessions: filteredArchive.filter((entry) => Number(entry.readinessScore) >= 4).length
      },
      recurringStrongestMoments: filteredInsightSummary.strongestMoments,
      recurringObjections: filteredInsightSummary.objections,
      recurringNextActions: filteredInsightSummary.nextActions,
      sessions: filteredArchive
    };

    const blob = new Blob([JSON.stringify(summaryPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feedback-summary.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function saveSessionEntry() {
    void saveSession();
  }

  if (!isLoaded) {
    return <div className="panel">Loading feedback workspace...</div>;
  }

  return (
    <div className="layout-grid">
      <div className="span-12 hero-banner stack">
        <span className="hero-kicker">Session Memory</span>
        <div className="actions">
          <a className="button secondary" href={dashboardHref}>
            Back To Dashboard
          </a>
          <a className="button secondary" href={pilotHref}>
            Pilot Package
          </a>
          <a className="button secondary" href={rehearsalHref}>
            Rehearsal Guide
          </a>
          <a className="button secondary" href={presenterHref}>
            Presenter Guide
          </a>
        </div>
        <h2>Feedback Capture</h2>
        <p>
          Capture structured notes after a rehearsal, advisor walkthrough, or pilot conversation. This workspace now saves
          through the app data layer and can export a JSON handoff artifact.
        </p>
        {error ? (
          <div className="panel" style={{ background: "var(--danger-soft)", boxShadow: "none" }}>
            {error}
          </div>
        ) : null}
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Saved sessions</strong>
            <p>Recent rehearsal and stakeholder notes kept in the shared feedback archive.</p>
            <span className="hero-stat-value">{archiveSummary.total}</span>
          </div>
          <div className="hero-stat">
            <strong>High-readiness sessions</strong>
            <p>Sessions scored 4 or 5 and likely ready for reuse.</p>
            <span className="hero-stat-value">{archiveSummary.strongCount}</span>
          </div>
          <div className="hero-stat">
            <strong>Latest save</strong>
            <p>Most recent archived feedback snapshot.</p>
            <span className="hero-stat-value" style={{ fontSize: 18 }}>{archiveSummary.latest}</span>
          </div>
          <div className="hero-stat">
            <strong>Resolved sessions</strong>
            <p>Archived entries already closed out and no longer treated as active follow-up.</p>
            <span className="hero-stat-value">{archiveSummary.resolvedCount}</span>
          </div>
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Session Setup</h3>
        <div className="diff-grid">
          <label className="stack" style={{ gap: 8 }}>
            <strong>Audience</strong>
            <select
              onChange={(event) => updateDraftField("audience", event.target.value as Audience)}
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.audience}
            >
              <option value="Product">Product</option>
              <option value="Clinical">Clinical</option>
              <option value="Regulatory">Regulatory</option>
            </select>
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Session Type</strong>
            <input
              onChange={(event) => updateDraftField("sessionType", event.target.value)}
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.sessionType}
            />
          </label>
        </div>
        <div className="diff-grid">
          <label className="stack" style={{ gap: 8 }}>
            <strong>Follow-Up Owner</strong>
            <input
              onChange={(event) => updateDraftField("followUpOwner", event.target.value)}
              placeholder="Name of the person carrying the follow-up"
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.followUpOwner}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Due Date</strong>
            <input
              onChange={(event) => updateDraftField("dueDate", event.target.value)}
              type="date"
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.dueDate}
            />
          </label>
        </div>
        <div className="diff-grid">
          <label className="stack" style={{ gap: 8 }}>
            <strong>Next Checkpoint</strong>
            <input
              onChange={(event) => updateDraftField("nextCheckpoint", event.target.value)}
              placeholder="What is the next concrete checkpoint?"
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.nextCheckpoint}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Why Overdue</strong>
            <input
              onChange={(event) => updateDraftField("overdueNote", event.target.value)}
              placeholder="Only needed if follow-up slips"
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.overdueNote}
            />
          </label>
        </div>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Linked Demo Case</strong>
          <select
            onChange={(event) => updateDraftField("relatedCaseId", event.target.value)}
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            value={draft.relatedCaseId}
          >
            {scenarioOptions.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stack" style={{ gap: 8 }}>
          <strong>Readiness Score</strong>
          <select
            onChange={(event) => updateDraftField("readinessScore", event.target.value)}
            style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
            value={draft.readinessScore}
          >
            <option value="1">1 - not ready</option>
            <option value="2">2 - weak</option>
            <option value="3">3 - usable</option>
            <option value="4">4 - strong</option>
            <option value="5">5 - ready</option>
          </select>
        </label>
        <div className="row">
          <div>
            <strong>Audience prompt</strong>
            <p>{audiencePrompts[draft.audience]}</p>
          </div>
          <span className="pill">{isSaving ? "Saving..." : `Saved ${draft.savedAt ?? "not yet"}`}</span>
        </div>
      </div>

      <div className="span-6 panel stack">
        <h3>Actions</h3>
        <div className="list">
          <div className="row">
            <div>
              <strong>Save session snapshot</strong>
              <p>Add the current feedback draft into the session archive for reuse across pilot and rehearsal cycles.</p>
            </div>
            <button className="button secondary" disabled={isSaving} onClick={saveSessionEntry} type="button">
              Save Session
            </button>
          </div>
          <div className="row">
            <div>
              <strong>Export feedback</strong>
              <p>Download the current notes as JSON for follow-up and handoff.</p>
            </div>
            <button className="button secondary" onClick={handleExport} type="button">
              Export JSON
            </button>
          </div>
          <div className="row">
            <div>
              <strong>Export archive</strong>
              <p>Download the saved session log for broader stakeholder review and follow-up.</p>
            </div>
            <button className="button secondary" disabled={!archive.length} onClick={handleArchiveExport} type="button">
              Export Archive
            </button>
          </div>
          <div className="row">
            <div>
              <strong>Export filtered summary</strong>
              <p>Download a compact summary for the current archive filters, including recurring themes and matching sessions.</p>
            </div>
            <button className="button secondary" disabled={!filteredArchive.length} onClick={handleFilteredSummaryExport} type="button">
              Export Summary
            </button>
          </div>
          <div className="row">
            <div>
              <strong>Reset notes</strong>
              <p>Clear the current note fields while keeping the audience and session setup.</p>
            </div>
            <button className="button secondary" disabled={isSaving} onClick={() => void resetDraftNotes()} type="button">
              Clear Notes
            </button>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Session Archive</h3>
        <div className="diff-grid">
          <label className="stack" style={{ gap: 8 }}>
            <strong>Audience Filter</strong>
            <select
              onChange={(event) => setArchiveAudienceFilter(event.target.value as Audience | "All")}
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={archiveAudienceFilter}
            >
              <option value="All">All audiences</option>
              <option value="Product">Product</option>
              <option value="Clinical">Clinical</option>
              <option value="Regulatory">Regulatory</option>
            </select>
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Readiness Filter</strong>
            <select
              onChange={(event) => setArchiveReadinessFilter(event.target.value as "All" | "High" | "Needs work")}
              style={{ borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={archiveReadinessFilter}
            >
              <option value="All">All scores</option>
              <option value="High">High readiness</option>
              <option value="Needs work">Needs work</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <input
            onChange={(event) => setArchiveQuery(event.target.value)}
            placeholder="Search strongest moments, objections, or next actions"
            style={{
              flex: "1 1 280px",
              borderRadius: 14,
              border: "1px solid var(--line)",
              padding: 12,
              font: "inherit",
              color: "var(--ink)"
            }}
            value={archiveQuery}
          />
          <button className="button secondary" disabled={!archive.length || isSaving} onClick={() => void clearArchive()} type="button">
            Clear Archive
          </button>
        </div>
        <div className="list">
          {filteredArchive.length ? (
            filteredArchive.map((entry) => (
              <div className="row" key={entry.id}>
                <div>
                  <strong>
                    {entry.audience} / {entry.sessionType}
                  </strong>
                  <p>
                    Status: {entry.resolutionStatus === "resolved" ? "Resolved" : "Open"}
                    {entry.resolvedAt ? ` at ${entry.resolvedAt}` : ""}
                  </p>
                  <p>Owner: {entry.followUpOwner || "Unassigned"}</p>
                  <p>Due: {entry.dueDate || "No due date set"}</p>
                  <p>Next checkpoint: {entry.nextCheckpoint || "No checkpoint set"}</p>
                  {isFeedbackEntryOverdue(entry) ? <p>Why overdue: {entry.overdueNote || "No overdue note recorded"}</p> : null}
                  <p>{entry.relatedCaseId ? `Linked case: ${entry.relatedCaseId}` : "No linked case"}</p>
                  <p>Readiness: {entry.readinessScore}/5</p>
                  <p>{entry.strongestMoment || "No strongest moment captured."}</p>
                  <p>{entry.nextActions || "No next actions captured."}</p>
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  {isFeedbackEntryOverdue(entry) ? <span className="tag danger">overdue</span> : null}
                  <span className={`tag ${entry.resolutionStatus === "resolved" ? "ok" : "warn"}`}>
                    {entry.resolutionStatus === "resolved" ? "resolved" : "open"}
                  </span>
                  <button
                    className="button secondary"
                    disabled={isSaving}
                    onClick={() => void updateResolution(entry.id, entry.resolutionStatus === "resolved" ? "open" : "resolved")}
                    type="button"
                  >
                    {entry.resolutionStatus === "resolved" ? "Reopen" : "Mark Resolved"}
                  </button>
                  {entry.resolutionStatus !== "resolved" ? (
                    <div className="stack" style={{ gap: 8, minWidth: 260 }}>
                      <input
                        onChange={(event) =>
                          setFollowUpDrafts((current) => ({
                            ...current,
                            [entry.id]: {
                              followUpOwner: event.target.value,
                              dueDate: current[entry.id]?.dueDate ?? entry.dueDate,
                              nextCheckpoint: current[entry.id]?.nextCheckpoint ?? entry.nextCheckpoint,
                              overdueNote: current[entry.id]?.overdueNote ?? entry.overdueNote
                            }
                          }))
                        }
                        placeholder="Follow-up owner"
                        style={{ borderRadius: 12, border: "1px solid var(--line)", padding: 10, font: "inherit", color: "var(--ink)" }}
                        value={followUpDrafts[entry.id]?.followUpOwner ?? entry.followUpOwner}
                      />
                      <input
                        onChange={(event) =>
                          setFollowUpDrafts((current) => ({
                            ...current,
                            [entry.id]: {
                              followUpOwner: current[entry.id]?.followUpOwner ?? entry.followUpOwner,
                              dueDate: current[entry.id]?.dueDate ?? entry.dueDate,
                              nextCheckpoint: current[entry.id]?.nextCheckpoint ?? entry.nextCheckpoint,
                              overdueNote: event.target.value
                            }
                          }))
                        }
                        placeholder="Why overdue"
                        style={{ borderRadius: 12, border: "1px solid var(--line)", padding: 10, font: "inherit", color: "var(--ink)" }}
                        value={followUpDrafts[entry.id]?.overdueNote ?? entry.overdueNote}
                      />
                      <input
                        onChange={(event) =>
                          setFollowUpDrafts((current) => ({
                            ...current,
                            [entry.id]: {
                              followUpOwner: current[entry.id]?.followUpOwner ?? entry.followUpOwner,
                              dueDate: current[entry.id]?.dueDate ?? entry.dueDate,
                              nextCheckpoint: event.target.value,
                              overdueNote: current[entry.id]?.overdueNote ?? entry.overdueNote
                            }
                          }))
                        }
                        placeholder="Next checkpoint"
                        style={{ borderRadius: 12, border: "1px solid var(--line)", padding: 10, font: "inherit", color: "var(--ink)" }}
                        value={followUpDrafts[entry.id]?.nextCheckpoint ?? entry.nextCheckpoint}
                      />
                      <input
                        onChange={(event) =>
                          setFollowUpDrafts((current) => ({
                            ...current,
                            [entry.id]: {
                              followUpOwner: current[entry.id]?.followUpOwner ?? entry.followUpOwner,
                              dueDate: event.target.value,
                              nextCheckpoint: current[entry.id]?.nextCheckpoint ?? entry.nextCheckpoint,
                              overdueNote: current[entry.id]?.overdueNote ?? entry.overdueNote
                            }
                          }))
                        }
                        type="date"
                        style={{ borderRadius: 12, border: "1px solid var(--line)", padding: 10, font: "inherit", color: "var(--ink)" }}
                        value={followUpDrafts[entry.id]?.dueDate ?? entry.dueDate}
                      />
                      <button
                        className="button secondary"
                        disabled={isSaving}
                        onClick={() =>
                          void updateFollowUp(entry.id, {
                            followUpOwner: followUpDrafts[entry.id]?.followUpOwner ?? entry.followUpOwner,
                            dueDate: followUpDrafts[entry.id]?.dueDate ?? entry.dueDate,
                            nextCheckpoint: followUpDrafts[entry.id]?.nextCheckpoint ?? entry.nextCheckpoint,
                            overdueNote: followUpDrafts[entry.id]?.overdueNote ?? entry.overdueNote
                          })
                        }
                        type="button"
                      >
                        Save Follow-Up
                      </button>
                    </div>
                  ) : null}
                  <span className="meta">{entry.savedAt ?? "No timestamp"}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>{archive.length ? "No sessions match the current filters" : "No saved sessions yet"}</strong>
                <p>
                  {archive.length
                    ? "Adjust the audience, readiness, or search filters to broaden the archive view."
                    : "Use “Save Session” after a rehearsal or stakeholder walkthrough to build a reusable feedback history."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Cross-Session Insights</h3>
        <div className="row">
          <div>
            <strong>Current filtered view</strong>
            <p>
              {filteredArchive.length} matching sessions with audience `{archiveAudienceFilter}`, readiness `{archiveReadinessFilter}`, and query `
              {archiveQuery || "none"}`.
            </p>
          </div>
          <span className="pill">Summary export ready</span>
        </div>
        <div className="layout-grid">
          <div className="span-4 panel stack" style={{ boxShadow: "none", background: "var(--panel-alt)" }}>
            <h3>Recurring Strongest Moments</h3>
            <div className="list">
              {insightSummary.strongestMoments.length ? (
                insightSummary.strongestMoments.map((item) => (
                  <div className="row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                    </div>
                    <span className="pill">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="row">
                  <div>
                    <strong>No repeated strongest moments yet</strong>
                    <p>Save a few sessions to start seeing reusable proof points.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="span-4 panel stack" style={{ boxShadow: "none", background: "var(--panel-alt)" }}>
            <h3>Recurring Objections</h3>
            <div className="list">
              {insightSummary.objections.length ? (
                insightSummary.objections.map((item) => (
                  <div className="row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                    </div>
                    <span className="pill">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="row">
                  <div>
                    <strong>No repeated objections yet</strong>
                    <p>Objections and confusion points will aggregate here as sessions are saved.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="span-4 panel stack" style={{ boxShadow: "none", background: "var(--panel-alt)" }}>
            <h3>Common Next Actions</h3>
            <div className="list">
              {insightSummary.nextActions.length ? (
                insightSummary.nextActions.map((item) => (
                  <div className="row" key={item.label}>
                    <div>
                      <strong>{item.label}</strong>
                    </div>
                    <span className="pill">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="row">
                  <div>
                    <strong>No repeated next actions yet</strong>
                    <p>Save session follow-ups to build a reusable improvement backlog.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="span-12 panel stack">
        <h3>Feedback Notes</h3>
        <div className="stack">
          <label className="stack" style={{ gap: 8 }}>
            <strong>Strongest Moment</strong>
            <textarea
              onChange={(event) => updateDraftField("strongestMoment", event.target.value)}
              placeholder="Which moment in the walkthrough felt most convincing?"
              style={{ width: "100%", minHeight: 120, borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.strongestMoment}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Confusion Or Friction</strong>
            <textarea
              onChange={(event) => updateDraftField("confusionPoint", event.target.value)}
              placeholder="What part of the story, workflow, or UI felt unclear?"
              style={{ width: "100%", minHeight: 120, borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.confusionPoint}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Objections Or Concerns</strong>
            <textarea
              onChange={(event) => updateDraftField("objections", event.target.value)}
              placeholder="Capture objections, risks, or skepticism that came up."
              style={{ width: "100%", minHeight: 120, borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.objections}
            />
          </label>
          <label className="stack" style={{ gap: 8 }}>
            <strong>Next Actions</strong>
            <textarea
              onChange={(event) => updateDraftField("nextActions", event.target.value)}
              placeholder="What should we change, test, or clarify before the next session?"
              style={{ width: "100%", minHeight: 120, borderRadius: 14, border: "1px solid var(--line)", padding: 12, font: "inherit", color: "var(--ink)" }}
              value={draft.nextActions}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
