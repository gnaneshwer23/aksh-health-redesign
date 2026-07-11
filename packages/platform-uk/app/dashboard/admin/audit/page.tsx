"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { AuditLogTable } from "@/components/dashboard/AuditLogTable";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export default function AdminAuditPage() {
  return (
    <DashboardShell role="admin" title="Audit Log">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => toast({ title: "Export initiated", description: "File ready in 2 minutes" })}
          >
            Export Full Audit Log
          </Button>
        </div>
        <AuditLogTable />
      </div>
    </DashboardShell>
  );
}
