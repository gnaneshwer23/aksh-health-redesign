"use client";

import { AdminHeroDemoPath } from "@/components/dashboard/admin/AdminHeroDemoPath";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function AdminAuditPage() {
  async function exportShield() {
    try {
      const response = await fetch("/api/audit/shield?limit=200", { credentials: "include" });
      if (!response.ok) throw new Error(`Export failed (${response.status})`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `aksh-shield-audit-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      try {
        await fetch("/api/audit/shield", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "export",
            agentLabel: "SHIELD",
            label: "SHIELD: admin exported durable audit JSON",
            detail: `events=${Array.isArray(data.events) ? data.events.length : 0}`,
            category: "system",
            resourceRef: "admin-audit-export"
          })
        });
      } catch {
        // Download still succeeded.
      }

      toast({
        title: "SHIELD export downloaded",
        description: data.durable
          ? "Durable Postgres trail exported."
          : "Export completed (may be empty or non-durable)."
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export audit log"
      });
    }
  }

  return (
    <DashboardShell role="admin" title="Audit Log">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <AdminHeroDemoPath />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted max-w-xl">
            Prefer durable Postgres SHIELD events when signed in. Export downloads JSON from{" "}
            <code>/api/audit/shield</code> and logs the export action — not a certified compliance pack.
            liveEmis:false · governance evidence only.
          </p>
          <Button variant="outline" onClick={() => void exportShield()}>
            Export SHIELD JSON
          </Button>
        </div>
        <AuditLogTable />
      </div>
    </DashboardShell>
  );
}
