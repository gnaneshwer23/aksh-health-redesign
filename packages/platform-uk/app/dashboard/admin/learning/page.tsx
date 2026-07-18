"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Download, RefreshCw } from "lucide-react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

type LearningEventRow = {
  id: string;
  recordedAt: string;
  agentLabel: string;
  predictionId: string;
  predictionSummary?: string;
  decision: string;
  decisionActor: string;
  decisionNotes?: string;
  outcomeKind: string;
  outcomeSummary?: string;
  autoRetrainTriggered: false;
  modelUpdated: false;
  ehrWrite: false;
  hitlRequired: true;
};

type LearningEventsResponse = {
  source?: string;
  count?: number;
  autoRetrain?: boolean;
  modelUpdates?: boolean;
  hitlMandatory?: boolean;
  events?: LearningEventRow[];
  error?: string;
};

type DecisionFilter = "all" | "accept" | "edit" | "reject";

function matchesDecisionFilter(decision: string, filter: DecisionFilter): boolean {
  if (filter === "all") return true;
  const normalized = decision.trim().toLowerCase();
  if (filter === "accept") return normalized.includes("accept");
  if (filter === "edit") return normalized.includes("edit");
  if (filter === "reject") return normalized.includes("reject");
  return true;
}

function toCsv(events: LearningEventRow[]): string {
  const headers = [
    "id",
    "recordedAt",
    "agentLabel",
    "predictionId",
    "predictionSummary",
    "decision",
    "decisionActor",
    "decisionNotes",
    "outcomeKind",
    "outcomeSummary",
    "autoRetrainTriggered",
    "ehrWrite"
  ];
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const rows = events.map((event) =>
    [
      event.id,
      event.recordedAt,
      event.agentLabel,
      event.predictionId,
      event.predictionSummary ?? "",
      event.decision,
      event.decisionActor,
      event.decisionNotes ?? "",
      event.outcomeKind,
      event.outcomeSummary ?? "",
      String(event.autoRetrainTriggered),
      String(event.ehrWrite)
    ]
      .map(escape)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Admin view of continuous-learning recorder events.
 * Read-only: prediction → clinician decision → outcome. No auto-retrain controls.
 */
export default function AdminLearningPage() {
  const { profile } = useUserProfile();
  const [payload, setPayload] = useState<LearningEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/learning/events?limit=50", {
        credentials: "include",
        cache: "no-store"
      });
      const data = (await response.json()) as LearningEventsResponse;
      if (!response.ok) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load learning events");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const events = payload?.events ?? [];
  const filteredEvents = useMemo(
    () => events.filter((event) => matchesDecisionFilter(event.decision, decisionFilter)),
    [events, decisionFilter]
  );

  const exportCsv = useCallback(() => {
    const csv = toCsv(filteredEvents);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `learning-events-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [filteredEvents]);

  return (
    <DashboardShell
      role="admin"
      title="Learning events"
      organisation={profile?.organisation}
    >
      <div className="space-y-6 overflow-y-auto p-4">
        <ConsentBanner />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Continuous learning recorder</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Append-only log of prediction → clinician decision → outcome.{" "}
              <strong>No auto-retrain</strong>, no silent model updates, no EHR write from this view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={decisionFilter}
              onValueChange={(value) => setDecisionFilter(value as DecisionFilter)}
            >
              <SelectTrigger className="w-36" data-testid="learning-decision-filter">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All decisions</SelectItem>
                <SelectItem value="accept">Accept</SelectItem>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="reject">Reject</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCsv}
              disabled={filteredEvents.length === 0}
              data-testid="learning-export-csv"
            >
              <Download className="mr-1 h-3 w-3" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div
          role="status"
          data-testid="learning-no-auto-retrain-banner"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"
        >
          Governance: <strong>autoRetrain={String(payload?.autoRetrain ?? false)}</strong> ·{" "}
          modelUpdates={String(payload?.modelUpdates ?? false)} · hitlMandatory=
          {String(payload?.hitlMandatory ?? true)}. Model releases require explicit CSO/release
          authority — not this screen.
        </div>

        {error ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted" />
              Recent events ({filteredEvents.length}
              {events.length !== filteredEvents.length ? ` of ${events.length}` : ""}
              {payload?.source ? ` · ${payload.source}` : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && events.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">Loading…</p>
            ) : events.length === 0 ? (
              <div
                data-testid="learning-empty-state"
                className="flex flex-col items-center gap-2 px-6 py-12 text-center"
              >
                <BookOpen className="h-8 w-8 text-muted/60" aria-hidden />
                <p className="text-sm font-medium text-foreground">No learning events yet</p>
                <p className="max-w-md text-sm text-muted">
                  Events appear after a clinician Accept / Edit / Reject on an agent draft is posted to{" "}
                  <code className="text-xs">/api/learning/events</code>. This recorder never
                  auto-retrains models.
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <p
                data-testid="learning-filter-empty"
                className="px-4 py-8 text-center text-sm text-muted"
              >
                No events match the current decision filter. Try “All decisions”.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs" data-testid="learning-events-table">
                  <thead className="border-b border-border-subtle bg-surface-muted/60 text-[10px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">Recorded</th>
                      <th className="px-3 py-2 font-medium">Agent</th>
                      <th className="px-3 py-2 font-medium">Prediction</th>
                      <th className="px-3 py-2 font-medium">Decision</th>
                      <th className="px-3 py-2 font-medium">Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="border-b border-border-subtle/80 align-top">
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {new Date(event.recordedAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">{event.agentLabel}</td>
                        <td className="px-3 py-2 text-foreground">
                          <span className="font-mono text-[10px] text-muted">{event.predictionId}</span>
                          {event.predictionSummary ? (
                            <p className="mt-0.5 max-w-xs text-muted">{event.predictionSummary}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                            {event.decision}
                          </span>
                          <p className="mt-1 text-muted">{event.decisionActor}</p>
                          {event.decisionNotes ? (
                            <p className="mt-0.5 text-muted">{event.decisionNotes}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span className="font-medium text-foreground">{event.outcomeKind}</span>
                          {event.outcomeSummary ? (
                            <p className="mt-0.5 text-muted">{event.outcomeSummary}</p>
                          ) : null}
                          <p className="mt-1 text-[10px] text-muted">
                            retrain={String(event.autoRetrainTriggered)} · ehr=
                            {String(event.ehrWrite)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
