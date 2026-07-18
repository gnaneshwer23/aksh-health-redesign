"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import type { ConnectorId, ConnectorStatus } from "@/lib/precision-health/connectors";

type ConnectorsResponse = {
  connectors?: ConnectorStatus[];
  liveStreamInvented?: boolean;
  ehrWrite?: boolean;
  note?: string;
  error?: string;
};

type IngestResponse = {
  accepted?: boolean;
  connectorId?: string;
  liveStream?: boolean;
  ehrWrite?: boolean;
  message?: string;
  error?: string;
  kg?: { attempted?: boolean; merged?: boolean; mode?: string };
};

const DEMO_INGEST_CONNECTORS: ConnectorId[] = [
  "wearable_synthetic_stream",
  "lifestyle_diary",
];

/**
 * Phase 2 connector registry + consent-gated synthetic ingest demo.
 * Fitbit / OpenWeather remain disabled for liveStream without keys — never invents device reads.
 */
export function ConnectorsIngestPanel({
  patientId = "P001",
  patientLabel = "Sarah Johnson (P001 · synthetic)",
}: {
  patientId?: string;
  patientLabel?: string;
}) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState<ConnectorId | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/precision-health/connectors", { credentials: "include" });
      const data = (await response.json()) as ConnectorsResponse;
      if (!response.ok) {
        toast({
          title: "Connectors unavailable",
          description: data.error ?? "Auth required to list connector registry.",
        });
        return;
      }
      setConnectors(data.connectors ?? []);
      setNote(data.note ?? "");
    } catch {
      toast({ title: "Connectors unavailable", description: "Network error." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runIngest = async (connectorId: ConnectorId) => {
    setIngesting(connectorId);
    setLastResult(null);
    try {
      const response = await fetch("/api/precision-health/ingest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectorId,
          purposeCode: "care_delivery",
          patientId,
          updateKg: true,
        }),
      });
      const data = (await response.json()) as IngestResponse;
      const summary = [
        data.accepted ? "accepted" : "refused",
        `liveStream:${String(data.liveStream ?? false)}`,
        `ehrWrite:${String(data.ehrWrite ?? false)}`,
        data.message ?? data.error ?? "",
      ].join(" · ");
      setLastResult(summary);

      if (response.status === 403 || data.accepted === false) {
        toast({
          title: "Ingest blocked (consent)",
          description:
            data.message ??
            "Grant wearable/lifestyle consent for this patient, then retry the synthetic demo.",
        });
      } else if (!response.ok) {
        toast({
          title: "Ingest failed",
          description: data.error ?? data.message ?? "Could not run ingest.",
        });
      } else {
        toast({
          title: "Synthetic ingest OK",
          description: "Consent-gated sample stored · liveStream:false · no EHR write",
        });
      }
    } catch {
      toast({ title: "Ingest failed", description: "Network error." });
    } finally {
      setIngesting(null);
    }
  };

  return (
    <Card className="shadow-sm" data-testid="connectors-ingest-panel">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">Modality connectors + consent-gated ingest</CardTitle>
        <p className="text-xs text-muted">
          Phase 2 scaffolding — synthetic demo for {patientLabel}. Fitbit liveStream stays off without
          FITBIT_CLIENT_* keys. Never invents device / DICOM / omics streams.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        {loading && connectors.length === 0 ? (
          <p className="text-sm text-muted">Loading connector registry…</p>
        ) : (
          <ul className="space-y-2">
            {connectors.map((c) => {
              const isFitbit = c.id === "fitbit_oauth_stub";
              const demoable = DEMO_INGEST_CONNECTORS.includes(c.id);
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-sm border border-border p-2 text-xs"
                  data-testid={`connector-row-${c.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {c.label}{" "}
                      <span className="font-normal text-muted">· {c.modality}</span>
                    </p>
                    <p className="mt-0.5 text-muted">{c.note}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                      enabled:{String(c.enabled)} · liveStream:{String(c.liveStream)}
                      {isFitbit && !c.liveStream
                        ? " · Fitbit stub disabled (no client key)"
                        : null}
                    </p>
                  </div>
                  {demoable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ingesting !== null}
                      onClick={() => void runIngest(c.id)}
                    >
                      {ingesting === c.id ? "Ingesting…" : "Demo ingest"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {note ? <p className="text-[11px] text-muted">{note}</p> : null}
        {lastResult ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted">
            Last ingest: {lastResult}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
