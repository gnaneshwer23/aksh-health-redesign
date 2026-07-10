"use client";

import type { Dispatch, SetStateAction } from "react";

import type { ReviewCase } from "@/lib/types";

import type { OpsAnalytics } from "./ops-dashboard-section-types";

export function MeetingPacketViewsCard({
  demoMode,
  recordingMode
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const modeQuery = `${demoMode ? "&demo=1" : ""}${recordingMode ? "&recording=1" : ""}`;

  return (
    <div className="span-6 panel stack">
      <h3>Meeting Packet Views</h3>
      <div className="list">
        {[
          {
            filter: "strong",
            title: "Strong packet",
            detail: "Open the highest-confidence dossiers for internal review meeting discussion."
          },
          {
            filter: "incomplete",
            title: "Incomplete packet",
            detail: "Review missing dossier sections and decide what evidence work is still required."
          },
          {
            filter: "near-promotion",
            title: "Near-promotion packet",
            detail: "Focus on cases that are closest to pilot-prep or RWE-candidate movement."
          },
          {
            filter: "remediation",
            title: "Remediation packet",
            detail: "Use a dedicated packet for cases that still need repair or reprioritization."
          }
        ].map((item) => (
          <div className="row" key={item.filter}>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <a className="button secondary" href={`/review/meeting-packet?filter=${item.filter}${modeQuery}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OwnerWorkloadBalancingCard({
  cases,
  handoffDrafts,
  isSaving,
  meetingOwnerWorkload,
  ownerDrafts,
  saveOwner,
  setHandoffDrafts,
  setOwnerDrafts
}: {
  cases: ReviewCase[];
  handoffDrafts: Record<string, { note: string; by: string }>;
  isSaving: boolean;
  meetingOwnerWorkload: OpsAnalytics["meetingOwnerWorkload"];
  ownerDrafts: Record<string, string>;
  saveOwner: (caseId: string) => Promise<void>;
  setHandoffDrafts: Dispatch<SetStateAction<Record<string, { note: string; by: string }>>>;
  setOwnerDrafts: Dispatch<SetStateAction<Record<string, string>>>;
}) {
  return (
    <div className="span-6 panel stack">
      <h3>Owner Workload Balancing</h3>
      <div className="list">
        {meetingOwnerWorkload.length ? (
          meetingOwnerWorkload.map((item) => (
            <div className="row" key={`owner-${item.owner}`}>
              <div className="stack" style={{ flex: 1 }}>
                <strong>{item.owner}</strong>
                <p>
                  {item.totalAssigned} assigned · {item.overdueCount} overdue · {item.needsEvidenceCount} needs evidence ·{" "}
                  {item.carryoverCount} carryover
                </p>
                {item.topCases.length ? (
                  item.topCases.map((topCase) => {
                    const reviewCase = cases.find((caseItem) => caseItem.id === topCase.id);

                    return (
                      <div className="row" key={`reassign-${topCase.id}`}>
                        <div className="stack" style={{ flex: 1 }}>
                          <strong>{topCase.patientLabel}</strong>
                          <p>
                            {topCase.dispositionLabel} · {topCase.slaLabel} · {topCase.ageDays} day(s) old
                          </p>
                          {reviewCase?.meetingOutcome?.handoffAt ? (
                            <p>
                              Last handoff: {reviewCase.meetingOutcome.handoffBy ?? "Ops"} at {reviewCase.meetingOutcome.handoffAt}
                            </p>
                          ) : null}
                          <label className="field">
                            <span>Handoff note</span>
                            <input
                              onChange={(event) =>
                                setHandoffDrafts((current) => ({
                                  ...current,
                                  [topCase.id]: {
                                    ...current[topCase.id],
                                    note: event.target.value
                                  }
                                }))
                              }
                              type="text"
                              value={handoffDrafts[topCase.id]?.note ?? ""}
                            />
                          </label>
                          <label className="field">
                            <span>Reassigned by</span>
                            <input
                              onChange={(event) =>
                                setHandoffDrafts((current) => ({
                                  ...current,
                                  [topCase.id]: {
                                    ...current[topCase.id],
                                    by: event.target.value
                                  }
                                }))
                              }
                              type="text"
                              value={handoffDrafts[topCase.id]?.by ?? "Ops Dashboard"}
                            />
                          </label>
                        </div>
                        <div className="actions">
                          <input
                            onChange={(event) =>
                              setOwnerDrafts((current) => ({
                                ...current,
                                [topCase.id]: event.target.value
                              }))
                            }
                            type="text"
                            value={ownerDrafts[topCase.id] ?? item.owner}
                          />
                          <button
                            className="button secondary"
                            disabled={isSaving}
                            onClick={() => void saveOwner(topCase.id)}
                            type="button"
                          >
                            {isSaving ? "Saving..." : "Reassign"}
                          </button>
                          <a className="button secondary" href={topCase.href}>
                            Open case
                          </a>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No active assigned cases.</p>
                )}
              </div>
              <div className="actions">
                <span className={`tag ${item.overdueCount > 0 ? "danger" : item.totalAssigned >= 3 ? "warn" : "ok"}`}>
                  {item.overdueCount > 0 ? "overloaded" : item.totalAssigned >= 3 ? "busy" : "balanced"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No owner assignments yet</strong>
              <p>Meeting follow-through owners have not been captured for the current cohort.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
