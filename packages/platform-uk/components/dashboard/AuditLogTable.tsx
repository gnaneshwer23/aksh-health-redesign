"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function AuditLogTable({ limit = 15 }: { limit?: number }) {
  const events = useDashboardStore((s) => s.auditEvents).slice(0, limit);

  return (
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
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString("en-GB")}</TableCell>
              <TableCell className="text-xs">{e.user}</TableCell>
              <TableCell className="text-xs">{e.agent}</TableCell>
              <TableCell className="text-xs">{e.action}</TableCell>
              <TableCell className="text-xs max-w-[200px] truncate">{e.resource}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
