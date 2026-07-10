"use client";

import { useEffect, useMemo, useState } from "react";

import { useReviewCases } from "@/lib/use-review-cases";
import type { MeetingDisposition } from "@/lib/types";
import { deriveMeetingOutcomeAnalytics, deriveValidationMeetingPacket } from "@/lib/workflow";

const packetFilters = [
  {
    id: "strong",
    label: "Strong Packets"
  },
  {
    id: "incomplete",
    label: "Incomplete Packets"
  },
  {
    id: "near-promotion",
    label: "Near-Promotion Packets"
  },
  {
    id: "remediation",
    label: "Remediation Packets"
  }
] as const;

export type MeetingPacketFilterId = (typeof packetFilters)[number]["id"];

const meetingDispositionOptions: Array<{
  id: MeetingDisposition;
  label: string;
}> = [
  { id: "promote", label: "Promote" },
  { id: "hold", label: "Hold" },
  { id: "remediate", label: "Remediate" },
  { id: "needs_evidence", label: "Needs Evidence" }
];

export function MeetingPacketPage({
  demoMode = false,
  initialFilter = "strong",
  recordingMode = false
}: {
  demoMode?: boolean;
  initialFilter?: MeetingPacketFilterId;
  recordingMode?: boolean;
}) {
  const { cases, isLoaded, isSaving, updateCase } = useReviewCases();
  const [draftOutcomes, setDraftOutcomes] = useState<
    Record<string, { disposition: MeetingDisposition; note: string; reviewedBy: string; followThroughOwner: string }>
  >({});

  const packet = useMemo(
    () => deriveValidationMeetingPacket(cases, initialFilter),
    [cases, initialFilter]
  );
  const meetingOutcomeAnalytics = useMemo(() => deriveMeetingOutcomeAnalytics(cases), [cases]);

  const sharedQuery = `${demoMode || recordingMode ? "?" : ""}${demoMode ? "demo=1" : ""}${demoMode && recordingMode ? "&" : ""}${recordingMode ? "recording=1" : ""}`;

  useEffect(() => {
    const nextDrafts = Object.fromEntries(
      cases.map((item) => [
        item.id,
        {
          disposition: item.meetingOutcome?.disposition ?? "hold",
          note: item.meetingOutcome?.note ?? "",
          reviewedBy: item.meetingOutcome?.reviewedBy ?? "Aksh Internal Review",
          followThroughOwner: item.meetingOutcome?.followThroughOwner ?? "Operations Lead"
        }
      ])
    );

    setDraftOutcomes(nextDrafts);
  }, [cases]);

  async function saveMeetingOutcome(caseId: string) {
    const reviewCase = cases.find((item) => item.id === caseId);
    const draft = draftOutcomes[caseId];

    if (!reviewCase || !draft) {
      return;
    }

    await updateCase({
      ...reviewCase,
      updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      meetingOutcome: {
        disposition: draft.disposition,
        note: draft.note.trim(),
        reviewedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        reviewedBy: draft.reviewedBy.trim() || "Aksh Internal Review",
        followThroughOwner: draft.followThroughOwner.trim() || "Operations Lead"
      }
    });
  }

  if (!isLoaded) {
    return <div className="panel">Loading meeting packet...</div>;
  }

  return (
    <div className="stack">
      <div className="panel stack">
        <div className="actions">
          {packetFilters.map((filter) => (
            <a
              className={`button ${initialFilter === filter.id ? "primary" : "secondary"}`}
              href={`/review/meeting-packet?filter=${filter.id}${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`}
              key={filter.id}
            >
              {filter.label}
            </a>
          ))}
        </div>
        <div className="row">
          <div>
            <strong>{packetFilters.find((item) => item.id === initialFilter)?.label ?? "Meeting Packet"}</strong>
            <p>{packet.summary}</p>
          </div>
          <span className="tag ok">{packet.caseCount} cases</span>
        </div>
        <div className="list">
          <div className="row">
            <div>
              <strong>Meeting outcomes captured</strong>
              <p>Cases that already have a recorded meeting disposition.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.totalCaptured}</span>
          </div>
          <div className="row">
            <div>
              <strong>Still uncaptured</strong>
              <p>Cases without a recorded internal meeting outcome yet.</p>
            </div>
            <span className="pill">{meetingOutcomeAnalytics.missingCount}</span>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="span-8 panel stack">
          <h2>Meeting Agenda</h2>
          <div className="list">
            {packet.agenda.map((item) => (
              <div className="row" key={item}>
                <div>
                  <strong>{item}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="span-4 panel stack">
          <h3>Packet Summary</h3>
          <div className="list">
            <div className="row">
              <div>
                <strong>Average score</strong>
                <p>Mean validation protocol score for this meeting cohort.</p>
              </div>
              <span className="pill">{packet.averageScore}</span>
            </div>
            <div className="row">
              <div>
                <strong>Total blockers</strong>
                <p>Aggregate blocker load still attached to this cohort.</p>
              </div>
              <span className="pill">{packet.totalBlockers}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="panel stack">
        <h3>Top Missing Sections</h3>
        <div className="list">
          {packet.topMissingSections.length ? (
            packet.topMissingSections.map((item) => (
              <div className="row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>Recurring dossier gap across this meeting cohort.</p>
                </div>
                <span className="pill">{item.count}</span>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No recurring missing sections</strong>
                <p>This cohort is dossier-complete at the section level.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel stack">
        <h2>Case Packets</h2>
        <div className="list">
          {packet.cases.length ? (
            packet.cases.map((item) => (
              <div className="row" key={item.id}>
                <div>
                  <strong>{item.patientLabel}</strong>
                  <p>{item.summary}</p>
                  <p>
                    Score {item.overallScore} · {item.recommendation.replaceAll("_", " ")} · {item.readinessLabel}
                  </p>
                  <p>
                    {item.missingSections.length
                      ? `Missing: ${item.missingSections.join(", ")}`
                      : "No missing dossier sections"}
                  </p>
                </div>
                <div className="actions">
                  <a className="button secondary" href={`/cases/${item.id}/dossier${sharedQuery}`}>
                    Dossier
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}/report${sharedQuery}`}>
                    Report
                  </a>
                  <a className="button secondary" href={`/cases/${item.id}/evidence${sharedQuery}`}>
                    Evidence
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No packets in this cohort</strong>
                <p>There are currently no cases matching the selected meeting packet filter.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel stack">
        <h2>Meeting Outcome Capture</h2>
        <div className="list">
          {packet.cases.length ? (
            packet.cases.map((item) => (
              <div className="row" key={`${item.id}-outcome`}>
                <div className="stack" style={{ flex: 1 }}>
                  <div>
                    <strong>{item.patientLabel}</strong>
                    <p>{item.summary}</p>
                    <p>
                      Current outcome:{" "}
                      {cases.find((reviewCase) => reviewCase.id === item.id)?.meetingOutcome?.disposition?.replaceAll("_", " ") ??
                        "not recorded"}
                    </p>
                  </div>
                  <label className="field">
                    <span>Disposition</span>
                    <select
                      value={draftOutcomes[item.id]?.disposition ?? "hold"}
                      onChange={(event) =>
                        setDraftOutcomes((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            disposition: event.target.value as MeetingDisposition
                          }
                        }))
                      }
                    >
                      {meetingDispositionOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Meeting note</span>
                    <textarea
                      rows={3}
                      value={draftOutcomes[item.id]?.note ?? ""}
                      onChange={(event) =>
                        setDraftOutcomes((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            note: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Reviewed by</span>
                    <input
                      type="text"
                      value={draftOutcomes[item.id]?.reviewedBy ?? "Aksh Internal Review"}
                      onChange={(event) =>
                        setDraftOutcomes((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            reviewedBy: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Follow-through owner</span>
                    <input
                      type="text"
                      value={draftOutcomes[item.id]?.followThroughOwner ?? "Operations Lead"}
                      onChange={(event) =>
                        setDraftOutcomes((current) => ({
                          ...current,
                          [item.id]: {
                            ...current[item.id],
                            followThroughOwner: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="actions">
                  <button className="button primary" disabled={isSaving} onClick={() => void saveMeetingOutcome(item.id)} type="button">
                    {isSaving ? "Saving..." : "Save Outcome"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="row">
              <div>
                <strong>No outcomes to record</strong>
                <p>There are currently no cases matching the selected meeting packet filter.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
