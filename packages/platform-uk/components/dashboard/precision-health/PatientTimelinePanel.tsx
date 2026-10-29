"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { BiomarkerLite } from "@/lib/precision-health/biomarkers";
import { formatBiomarkerLite } from "@/lib/precision-health/biomarkers";
import type { PatientTimelineEvent, TimelineEventKind } from "@/lib/precision-health/timeline";
import { cn } from "@/lib/utils";

type TimelineResponse = {
  patientId?: string;
  patientLabel?: string;
  eventCount?: number;
  events?: PatientTimelineEvent[];
  note?: string;
  unifiedHealthRecord?: boolean;
  error?: string;
};

const KIND_LABELS: Record<TimelineEventKind, string> = {
  case_activity: "Case",
  modality_sample: "Modality",
  learning_outcome: "Learning",
  consent_change: "Consent",
  health_plan: "Health plan",
  coaching_draft: "Coaching",
  risk_state: "Risk state",
  care_journey: "Care journey",
  continuous_care: "Continuous care",
};

function biomarkersFromEvent(event: PatientTimelineEvent): BiomarkerLite | undefined {
  const raw = event.metadata?.biomarkers;
  if (!raw || typeof raw !== "object") return undefined;
  return raw as BiomarkerLite;
}

export function PatientTimelinePanel({
  patientId,
  patientLabel,
  refreshKey = 0,
}: {
  patientId: string;
  patientLabel?: string;
  /** Increment after a successful role ingest to reload the merged timeline. */
  refreshKey?: number;
}) {
  const [events, setEvents] = useState<PatientTimelineEvent[]>([]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [eventCount, setEventCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/timeline`, {
        credentials: "include",
      });
      const data = (await response.json()) as TimelineResponse;
      if (!response.ok) {
        toast({
          title: "Timeline unavailable",
          description: data.error ?? "Could not load merged timeline.",
        });
        return;
      }
      setEvents(data.events ?? []);
      setEventCount(data.eventCount ?? data.events?.length ?? 0);
      setNote(data.note ?? "");
    } catch {
      toast({ title: "Timeline unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <Card className="shadow-sm" data-testid="patient-timeline-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">Patient timeline</CardTitle>
          <p className="text-xs text-muted">
            {patientLabel ? `${patientLabel} · ` : ""}
            Merged case · modality · learning · consent events — biomarker-lite from ingested samples;
            not a production unified health record
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {loading ? (
          <p className="text-sm text-muted">Loading timeline…</p>
        ) : events.length === 0 ? (
          <p
            role="status"
            data-testid="patient-timeline-empty"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            No merged timeline events yet for this synthetic patient. Grant consent and ingest modality
            stubs, or open a review case, then refresh.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-muted" data-testid="patient-timeline-count">
              {eventCount} event{eventCount === 1 ? "" : "s"} · demo merge only
            </p>
            <ol className="space-y-2" data-testid="patient-timeline-list">
              {events.map((event) => {
                const biomarkers = biomarkersFromEvent(event);
                const chips = biomarkers ? formatBiomarkerLite(biomarkers) : [];
                return (
                  <li
                    key={event.id}
                    className="rounded-sm border border-border-subtle bg-card p-3 text-xs"
                    data-testid={
                      event.kind === "modality_sample" ? "timeline-modality-event" : undefined
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          "bg-primary/10 text-primary"
                        )}
                      >
                        {KIND_LABELS[event.kind] ?? event.kind}
                      </span>
                      <time className="text-muted" dateTime={event.occurredAt}>
                        {new Date(event.occurredAt).toLocaleString("en-GB")}
                      </time>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-muted">{event.summary}</p>
                    {chips.length > 0 ? (
                      <ul
                        className="mt-2 flex flex-wrap gap-1.5"
                        data-testid="timeline-biomarker-lite"
                      >
                        {chips.map((chip) => (
                          <li
                            key={chip}
                            className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            {chip}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-1 text-[10px] text-muted">
                      Source: {event.source} · ehrWrite: false
                      {chips.length > 0 ? " · biomarker-lite (sample fields)" : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
          </>
        )}
        {note ? (
          <p className="text-[10px] leading-relaxed text-muted" data-testid="patient-timeline-note">
            {note}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
