import React from "react";
import { AuditEvent } from "@/lib/types";

type ActivityFilter = AuditEvent["category"] | "all";

export function ActivityTimelinePanel({
  filteredAuditEvents,
  activityFilter,
  setActivityFilter
}: {
  filteredAuditEvents: AuditEvent[];
  activityFilter: ActivityFilter;
  setActivityFilter: (v: ActivityFilter) => void;
}) {
  const activityGroups: ActivityFilter[] = ["all", "system", "reviewer_edit", "reviewer_decision", "reviewer_note", "override"];
  return (
    <div className="panel stack">
      <h3>Activity Timeline</h3>
      <div className="tabs">
        {activityGroups.map((item) => (
          <button
            className={`tab ${activityFilter === item ? "active" : ""}`}
            key={item}
            onClick={() => setActivityFilter(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      {filteredAuditEvents.map((event) => (
        <div className="row" key={event.id}>
          <div>
            <strong>{event.label}</strong>
            <p>{event.category}</p>
            {event.detail ? <p>{event.detail}</p> : null}
            <p>{event.actor}</p>
          </div>
          <span className="meta">{event.timestamp}</span>
        </div>
      ))}
      {!filteredAuditEvents.length ? (
        <div className="row">
          <div>
            <strong>No events in this filter</strong>
            <p>Switch filters to review other activity groups.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
