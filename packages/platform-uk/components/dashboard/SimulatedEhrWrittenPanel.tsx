"use client";

import { useEffect, useState } from "react";

type SimEntry = {
  id: string;
  writtenAt: string;
  partner: "simulated_emis" | "simulated_systmone";
  resourceType: string;
  summary: string;
  acceptedBy: string;
  liveEmis: false;
  realPatientData: false;
};

export function SimulatedEhrWrittenPanel({ patientId }: { patientId: string | null }) {
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!patientId) {
      setEntries([]);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/integrations/simulated-ehr?patientId=${encodeURIComponent(patientId!)}`,
          { credentials: "include", cache: "no-store" }
        );
        const json = (await res.json()) as {
          error?: string;
          chart?: { entries?: SimEntry[] };
          liveEmis?: boolean;
        };
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Simulated EHR unavailable");
          return;
        }
        if (!cancelled) {
          setError(null);
          setEntries(json.chart?.entries ?? []);
        }
      } catch {
        if (!cancelled) setError("Simulated EHR unavailable");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="mt-3 space-y-2" data-testid="simulated-ehr-written-panel">
      <p className="text-xs text-muted">
        Simulated EMIS / SystmOne chart · staging rehearsal · liveEmis:false · not a live EHR write
      </p>
      {error ? <p className="text-xs text-muted">{error}</p> : null}
      {entries.length === 0 && !error ? (
        <p className="text-xs text-muted">No simulated chart entries yet — Accept a draft to stage.</p>
      ) : null}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="rounded-xl border border-border-subtle/80 bg-card/40 p-3 text-xs shadow-sm"
        >
          <p className="font-medium text-foreground">
            {entry.partner === "simulated_emis" ? "Simulated EMIS Web" : "Simulated SystmOne"} ·{" "}
            {entry.resourceType}
          </p>
          <p className="mt-1 text-muted line-clamp-2">{entry.summary}</p>
          <p className="mt-1 text-muted/80">
            {entry.acceptedBy} · {new Date(entry.writtenAt).toLocaleString("en-GB")} · liveEmis:false
          </p>
        </div>
      ))}
    </div>
  );
}
