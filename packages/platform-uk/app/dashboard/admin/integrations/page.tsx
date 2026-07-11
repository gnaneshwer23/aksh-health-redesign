"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";

export default function AdminIntegrationsPage() {
  return (
    <DashboardShell role="admin" title="Integrations">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <IntegrationStatus />
      </div>
    </DashboardShell>
  );
}
