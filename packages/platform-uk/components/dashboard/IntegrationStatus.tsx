"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type IntegrationRow = {
  id: string;
  label: string;
  status: string;
  detail: string;
  tone: "ok" | "warn" | "muted";
};

type EmisStatus = {
  status?: string;
  configured?: boolean;
  liveWriteBack?: boolean;
  queueDepth?: number;
  note?: string;
};

type BridgeStatus = {
  queueDepth?: number;
  storagePreference?: string;
  note?: string;
  liveEmis?: boolean;
};

type HealthPayload = {
  database?: { connected?: boolean; mode?: string };
  neo4j?: { connected?: boolean; mode?: string; configured?: boolean; note?: string };
};

function toneClass(tone: IntegrationRow["tone"]) {
  if (tone === "ok") return "bg-accent";
  if (tone === "warn") return "bg-warning";
  return "bg-muted";
}

export function IntegrationStatus() {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, emisRes, bridgeRes, contractRes] = await Promise.all([
        fetch("/api/health", { cache: "no-store" }),
        fetch("/api/integrations/emis-staging", { credentials: "include", cache: "no-store" }),
        fetch("/api/integrations/bridge-staging", { credentials: "include", cache: "no-store" }),
        fetch("/api/system/integration-contract", { credentials: "include", cache: "no-store" })
      ]);

      const health = healthRes.ok ? ((await healthRes.json()) as HealthPayload) : null;
      const emis = emisRes.ok ? ((await emisRes.json()) as EmisStatus) : null;
      const bridge = bridgeRes.ok ? ((await bridgeRes.json()) as BridgeStatus) : null;
      const contract = contractRes.ok
        ? ((await contractRes.json()) as {
            externalAdapters?: Array<{
              id?: string;
              label?: string;
              status?: string;
              boundary?: string;
            }>;
            internalEvidenceAdapters?: Array<{
              id?: string;
              label?: string;
              status?: string;
              boundary?: string;
            }>;
          })
        : null;

      const next: IntegrationRow[] = [];

      next.push({
        id: "postgres",
        label: "Postgres (auth / SHIELD)",
        status: health?.database?.connected ? "Connected" : "Unavailable",
        detail: health?.database
          ? `mode=${health.database.mode ?? "unknown"}`
          : "Health probe failed",
        tone: health?.database?.connected ? "ok" : "warn"
      });

      next.push({
        id: "neo4j",
        label: "Neo4j graph",
        status: health?.neo4j?.connected
          ? "Live"
          : health?.neo4j?.configured
            ? "Mock fallback"
            : "Not configured",
        detail: health?.neo4j?.note ?? `mode=${health?.neo4j?.mode ?? "unknown"}`,
        tone: health?.neo4j?.connected ? "ok" : "warn"
      });

      next.push({
        id: "bridge-staging",
        label: "BRIDGE FHIR staging",
        status: "Preliminary · Neon/file",
        detail: bridge?.note
          ? `${bridge.note}${typeof bridge.queueDepth === "number" ? ` · recent ${bridge.queueDepth}` : ""} · storage=${bridge.storagePreference ?? "…"}`
          : bridgeRes.ok
            ? "In-app FHIR staging · Medplum not required · liveEmis:false"
            : "Sign in required to load BRIDGE staging status.",
        tone: bridge?.liveEmis ? "warn" : "muted"
      });

      next.push({
        id: "emis-staging",
        label: "EHR FHIR staging",
        status: emis?.liveWriteBack
          ? "Live write-back (unexpected)"
          : emis?.configured
            ? "Credentials present · write-back disabled"
            : "Scaffold only",
        detail: emis?.note
          ? `${emis.note}${typeof emis.queueDepth === "number" ? ` · queue ${emis.queueDepth}` : ""}`
          : emisRes.ok
            ? "No live EHR partner write-back in this build."
            : "Sign in required to load EHR staging status.",
        tone: emis?.liveWriteBack ? "warn" : "muted"
      });

      const adapters = [
        ...(contract?.externalAdapters ?? []),
        ...(contract?.internalEvidenceAdapters ?? [])
      ];
      for (const adapter of adapters.slice(0, 8)) {
        if (!adapter.id || adapter.id === "emis-fhir-staging") continue;
        next.push({
          id: adapter.id,
          label: adapter.label ?? adapter.id,
          status: adapter.status ?? "unknown",
          detail: adapter.boundary ?? "See integration contract.",
          tone:
            adapter.status === "enabled" || adapter.status === "available"
              ? "ok"
              : adapter.status === "planned" || adapter.status === "scaffolded"
                ? "muted"
                : "warn"
        });
      }

      if (next.length === 0) {
        next.push({
          id: "empty",
          label: "Integrations",
          status: "Unavailable",
          detail: "Could not load health or integration contract.",
          tone: "warn"
        });
      }

      setRows(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
      setRows([
        {
          id: "error",
          label: "Integration status",
          status: "Error",
          detail: "Could not refresh honest integration status.",
          tone: "warn"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-sm">Integration Status</CardTitle>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-2">
        <p className="text-[10px] text-muted">
          Live probe from <code>/api/health</code>, EMIS staging, and integration contract — not fake “Healthy”
          EHR syncs. No live the EHR write-back.
        </p>
        {error ? <p className="text-[10px] text-danger">{error}</p> : null}
        {rows.map((svc) => (
          <div
            key={svc.id}
            className="flex items-start justify-between gap-3 text-xs border-b border-border py-2 last:border-0"
          >
            <div className="flex items-start gap-2 min-w-0">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", toneClass(svc.tone))} />
              <div className="min-w-0">
                <p className="font-medium">{svc.label}</p>
                <p className="text-[10px] text-muted leading-snug">{svc.detail}</p>
              </div>
            </div>
            <p className="shrink-0 text-right text-muted max-w-[40%]">{svc.status}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
