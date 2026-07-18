"use client";

import { useEffect, useState } from "react";

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

export function AuditLogTable({ limit = 15 }: { limit?: number }) {
  const mockEvents = useDashboardStore((s) => s.auditEvents).slice(0, limit);
  const [rows, setRows] = useState<AuditRow[]>(
    mockEvents.map((e) => ({
      id: e.id,
      timestamp: e.timestamp,
      user: e.user,
      agent: String(e.agent),
      action: e.action,
      resource: e.resource
    }))
  );
  const [source, setSource] = useState<"postgres" | "mock" | "loading">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/audit/shield?limit=${limit}`, { credentials: "include" });
        if (!response.ok) throw new Error("audit fetch failed");
        const data = (await response.json()) as {
          durable?: boolean;
          events?: AuditRow[];
        };
        if (cancelled) return;
        if (data.durable && Array.isArray(data.events) && data.events.length > 0) {
          setRows(data.events);
          setSource("postgres");
          return;
        }
        setSource("mock");
      } catch {
        if (!cancelled) setSource("mock");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {source === "loading"
          ? "Loading audit trail…"
          : source === "postgres"
            ? "Durable SHIELD audit (Postgres, append-only)."
            : "Showing local rehearsal events — durable Postgres trail empty or unavailable."}
      </p>
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
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(e.timestamp).toLocaleString("en-GB")}
                </TableCell>
                <TableCell className="text-xs">{e.user}</TableCell>
                <TableCell className="text-xs">{resolveClinicalAgentLabel(e.agent)}</TableCell>
                <TableCell className="text-xs">{e.action}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{e.resource}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
