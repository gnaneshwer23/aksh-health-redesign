"use client";

import { useMemo } from "react";

import { isFeedbackEntryOverdue } from "@/lib/feedback-insights";
import { useFeedbackState } from "@/lib/use-feedback-state";

function collectTopPhrases(
  entries: ReturnType<typeof useFeedbackState>["archive"],
  selector: (entry: ReturnType<typeof useFeedbackState>["archive"][number]) => string
) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const value = selector(entry).trim();
    if (!value) continue;

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

export function FeedbackLinkedPanel({
  caseId,
  demoMode = false,
  recordingMode = false
}: {
  caseId: string;
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const { archive, isLoaded } = useFeedbackState();
  const linkedEntries = useMemo(() => archive.filter((entry) => entry.relatedCaseId === caseId), [archive, caseId]);
  const openEntries = useMemo(() => linkedEntries.filter((entry) => entry.resolutionStatus !== "resolved"), [linkedEntries]);
  const resolvedEntries = useMemo(() => linkedEntries.filter((entry) => entry.resolutionStatus === "resolved"), [linkedEntries]);
  const overdueEntries = useMemo(() => openEntries.filter((entry) => isFeedbackEntryOverdue(entry)), [openEntries]);
  const strongestMoments = useMemo(
    () => collectTopPhrases(linkedEntries, (entry) => entry.strongestMoment),
    [linkedEntries]
  );
  const objections = useMemo(
    () => collectTopPhrases(linkedEntries, (entry) => entry.objections || entry.confusionPoint),
    [linkedEntries]
  );
  const nextActions = useMemo(() => collectTopPhrases(linkedEntries, (entry) => entry.nextActions), [linkedEntries]);
  const feedbackHref = `/review/feedback${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  if (!isLoaded) {
    return <div className="panel">Loading linked feedback...</div>;
  }

  return (
    <div className="panel stack">
      <div className="actions">
        <h3 style={{ marginRight: "auto" }}>Linked Feedback</h3>
        <a className="button secondary" href={feedbackHref}>
          Open Feedback Workspace
        </a>
      </div>
      <div className="row">
        <div>
          <strong>Saved sessions for this case</strong>
          <p>Stakeholder and rehearsal notes explicitly linked to {caseId}.</p>
        </div>
        <div className="pill-row">
          <span className="pill">{linkedEntries.length} total</span>
          <span className="pill">{openEntries.length} open</span>
          <span className="pill">{resolvedEntries.length} resolved</span>
          <span className="pill">{overdueEntries.length} overdue</span>
        </div>
      </div>
      {linkedEntries.length ? (
        <>
          <div className="signal-grid">
            <div className="signal-card">
              <strong>Strongest moments</strong>
              <p>{strongestMoments[0]?.label ?? "No repeated strongest moment yet."}</p>
            </div>
            <div className="signal-card">
              <strong>Top objection</strong>
              <p>{objections[0]?.label ?? "No repeated objection yet."}</p>
            </div>
            <div className="signal-card">
              <strong>Next action</strong>
              <p>{nextActions[0]?.label ?? "No repeated next action yet."}</p>
            </div>
          </div>
          <div className="list">
            {linkedEntries.slice(0, 3).map((entry) => (
              <div className="row" key={entry.id}>
                <div>
                  <strong>
                    {entry.audience} / {entry.sessionType}
                  </strong>
                  <p>Status: {entry.resolutionStatus === "resolved" ? "Resolved" : "Open"}</p>
                  <p>Owner: {entry.followUpOwner || "Unassigned"}</p>
                  <p>Due: {entry.dueDate || "No due date set"}</p>
                  <p>Next checkpoint: {entry.nextCheckpoint || "No checkpoint set"}</p>
                  {isFeedbackEntryOverdue(entry) ? <p>Why overdue: {entry.overdueNote || "No overdue note recorded"}</p> : null}
                  <p>{entry.strongestMoment || "No strongest moment captured."}</p>
                  <p>{entry.nextActions || "No next actions captured."}</p>
                </div>
                <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                  {isFeedbackEntryOverdue(entry) ? <span className="tag danger">overdue</span> : null}
                  <span className={`tag ${entry.resolutionStatus === "resolved" ? "ok" : "warn"}`}>
                    {entry.resolutionStatus === "resolved" ? "resolved" : "open"}
                  </span>
                  <span className="meta">{entry.savedAt ?? "No timestamp"}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="row">
          <div>
            <strong>No linked feedback yet</strong>
            <p>Save a feedback session and link it to this case to surface objections, strongest proof moments, and follow-up actions here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
