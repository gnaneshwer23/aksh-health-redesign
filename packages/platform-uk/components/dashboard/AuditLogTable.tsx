"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resolveClinicalAgentLabel } from "@/lib/agents";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

type AuditRow = {
  id: string;
  timestamp: string;
  user: string;
  agent: string;
  action: string;
  resource: string;
};

function toMockRows(
  events: Array<{
    id: string;
    timestamp: string;
    user: string;
    agent: string | number;
    action: string;
    resource: string;
  }>,
  limit: number
): AuditRow[] {
  return events.slice(0, limit).map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    user: e.user,
    agent: String(e.agent),
    action: e.action,
    resource: e.resource
  }));
}

export function AuditLogTable({ limit = 15 }: { limit?: number }) {
  const mockEvents = useDashboardStore((s) => s.auditEvents);
  const [rows, setRows] = useState<AuditRow[]>(() => toMockRows(mockEvents, limit));
  const [source, setSource] = useState<"postgres" | "mock" | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setSource("loading");
    setError(null);
    const fallback = toMockRows(mockEvents, limit);
    try {
      const response = await fetch(`/api/audit/shield?limit=${limit}`, { credentials: "include" });
      if (!response.ok) throw new Error(`audit fetch failed (${response.status})`);
      const data = (await response.json()) as {
        durable?: boolean;
        source?: string;
        events?: AuditRow[];
      };

      // Prefer Postgres whenever the API reports a durable source — including an empty trail.
      if (data.durable || data.source === "postgres") {
        setRows(Array.isArray(data.events) ? data.events : []);
        setSource("postgres");
        return;
      }

      setRows(fallback);
      setSource("mock");
    } catch (err) {
      setRows(fallback);
      setSource("mock");
      setError(err instanceof Error ? err.message : "audit fetch failed");
    }
  }, [limit, mockEvents]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {source === "loading"
            ? "Loading audit trail…"
            : source === "postgres"
              ? rows.length === 0
                ? "Durable SHIELD audit (Postgres) — no events yet. Nurse/pharmacist/GP HITL actions append here."
                : "Durable SHIELD audit (Postgres, append-only)."
              : error
                ? `Local rehearsal events — durable trail unavailable (${error}).`
                : "Showing local rehearsal events — sign in with Postgres for the durable trail."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={source === "loading"}
        >
          Refresh
        </Button>
      </div>
      <ScrollArea className="h-[400px] rounded-sm border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-xs text-muted-foreground text-center py-8">
                  No durable SHIELD events yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString("en-GB")}
                  </TableCell>
                  <TableCell className="text-xs">{e.user}</TableCell>
                  <TableCell className="text-xs">{resolveClinicalAgentLabel(e.agent)}</TableCell>
                  <TableCell className="text-xs">{e.action}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{e.resource}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
