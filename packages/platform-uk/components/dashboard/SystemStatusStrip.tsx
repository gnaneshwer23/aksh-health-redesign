"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Database, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type HealthPayload = {
  status?: "ok" | "degraded";
  database?: { configured?: boolean; connected?: boolean; mode?: string };
  neo4j?: {
    configured?: boolean;
    connected?: boolean;
    mode?: string;
    note?: string;
  };
};

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        ok ? "bg-accent" : warn ? "bg-warning" : "bg-danger"
      )}
      aria-hidden
    />
  );
}

export function SystemStatusStrip() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error(`health ${response.status}`);
      const data = (await response.json()) as HealthPayload;
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "health unavailable");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dbOk = Boolean(health?.database?.connected);
  const neoOk = Boolean(health?.neo4j?.connected);
  const neoConfigured = Boolean(health?.neo4j?.configured);
  const overallOk = health?.status === "ok";

  return (
    <Card className="shadow-sm border-border-subtle">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="h-3.5 w-3.5 text-muted" />
            System status
            {loading ? (
              <span className="text-muted font-normal">checking…</span>
            ) : error ? (
              <span className="text-danger font-normal">{error}</span>
            ) : (
              <span className={overallOk ? "text-accent" : "text-warning"}>
                {health?.status ?? "unknown"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <StatusDot ok={dbOk} />
            <Database className="h-3 w-3" />
            Postgres{" "}
            {health?.database
              ? `${health.database.mode ?? "?"} · ${dbOk ? "connected" : "down"}`
              : "—"}
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <StatusDot ok={neoOk} warn={neoConfigured && !neoOk} />
            Neo4j{" "}
            {health?.neo4j
              ? `${health.neo4j.mode ?? "?"} · ${neoOk ? "live" : neoConfigured ? "mock fallback" : "unconfigured"}`
              : "—"}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
        {health?.neo4j?.note && !neoOk ? (
          <p className="w-full text-[10px] text-muted">{health.neo4j.note}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
