"use client";

import Link from "next/link";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";
import { PharmaPayerStubPanel } from "@/components/dashboard/precision-health/PharmaPayerStubPanel";

export default function AdminIntegrationsPage() {
  return (
    <DashboardShell role="admin" title="Integrations">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <p className="text-xs text-muted">
          Connector ingest demo, twin/EMIS honesty flags, and partner checklist pointers live on{" "}
          <Link
            href="/dashboard/admin/precision-health"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Precision Health status
          </Link>
          .
        </p>
        <IntegrationStatus />
        <PharmaPayerStubPanel />
      </div>
    </DashboardShell>
  );
}
