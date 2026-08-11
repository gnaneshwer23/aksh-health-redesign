"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

/**
 * D5 (docs/PHASED_BUILD_PLAN_D.md, P2-3): read-only Patient State fact
 * history — fact type, value, source, confidence, effective/recorded
 * timestamps, and a "superseded" marker for non-current facts. Reads
 * GET /api/patients/[id]/state (C1) verbatim, using that route's D5-added
 * `facts` field — no new API endpoint, no write path.
 *
 * Does not overstate certainty: confidence/source are shown exactly as
 * recorded, never given an invented default when absent.
 */

type PatientStateFactShape = {
  id: string;
  patientId: string;
  factType: string;
  value: unknown;
  source: { system: string; reference?: string };
  confidence: number;
  consentScopeId: string | null;
  effectiveAt: string;
  recordedAt: string;
  supersededBy: string | null;
};

type PatientStateResponse = {
  patientId?: string;
  patientLabel?: string;
  facts?: PatientStateFactShape[];
  factHistoryCount?: number;
  factHistorySource?: "postgres" | "file";
  note?: string;
  error?: string;
};

function formatFactValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    const json = JSON.stringify(value);
    return json.length > 140 ? `${json.slice(0, 140)}…` : json;
  } catch {
    return "(unrenderable value)";
  }
}

export function PatientStatePanel({
  patientId,
  patientLabel,
  refreshKey = 0,
}: {
  patientId: string;
  patientLabel?: string;
  /** Increment to reload after an action elsewhere on the page writes a new Patient State fact. */
  refreshKey?: number;
}) {
  const [facts, setFacts] = useState<PatientStateFactShape[]>([]);
  const [factHistorySource, setFactHistorySource] = useState<"postgres" | "file" | null>(null);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/state`, {
        credentials: "include",
      });
      const data = (await response.json()) as PatientStateResponse;
      if (!response.ok) {
        toast({
          title: "Patient State unavailable",
          description: data.error ?? "Could not load Patient State history.",
        });
        return;
      }
      // Newest-recorded-first — mirrors clinician expectation of "what happened most recently".
      const ordered = [...(data.facts ?? [])].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
      setFacts(ordered);
      setFactHistorySource(data.factHistorySource ?? null);
      setNote(data.note ?? "");
    } catch {
      toast({ title: "Patient State unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <Card className="shadow-sm" data-testid="patient-state-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <CardTitle className="text-sm">Patient State</CardTitle>
          <p className="text-xs text-muted">
            {patientLabel ? `${patientLabel} · ` : ""}
            Versioned, append-only fact history — current and superseded facts alike; read-only, no write path
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {loading ? (
          <p className="text-sm text-muted">Loading Patient State…</p>
        ) : facts.length === 0 ? (
          <p
            role="status"
            data-testid="patient-state-empty"
            className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted"
          >
            No Patient State facts recorded yet for this patient.
          </p>
        ) : (
          <>
            <p className="text-[11px] text-muted" data-testid="patient-state-count">
              {facts.length} fact{facts.length === 1 ? "" : "s"} · source: {factHistorySource ?? "unknown"}
            </p>
            <ol className="space-y-2" data-testid="patient-state-list">
              {facts.map((fact) => {
                const isSuperseded = fact.supersededBy !== null;
                return (
                  <li
                    key={fact.id}
                    className="rounded-sm border border-border-subtle bg-card p-3 text-xs"
                    data-testid="patient-state-fact"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {fact.factType}
                      </span>
                      {isSuperseded ? (
                        <span
                          className="inline-flex rounded bg-muted/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                          data-testid="patient-state-fact-superseded"
                        >
                          Superseded
                        </span>
                      ) : (
                        <span className="inline-flex rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                          Current
                        </span>
                      )}
                      <time className="text-muted" dateTime={fact.effectiveAt}>
                        effective {new Date(fact.effectiveAt).toLocaleString("en-GB")}
                      </time>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{formatFactValue(fact.value)}</p>
                    <p className="mt-1 text-[10px] text-muted">
                      Source: {fact.source.system}
                      {fact.source.reference ? ` (${fact.source.reference})` : ""} · Confidence:{" "}
                      {typeof fact.confidence === "number" ? fact.confidence.toFixed(2) : "not recorded"} · Recorded{" "}
                      {new Date(fact.recordedAt).toLocaleString("en-GB")}
                    </p>
                  </li>
                );
              })}
            </ol>
          </>
        )}
        {note ? (
          <p className="text-[10px] leading-relaxed text-muted" data-testid="patient-state-note">
            {note}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
