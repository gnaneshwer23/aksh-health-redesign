"use client";

import Link from "next/link";

import { AdminHeroDemoPath } from "@/components/dashboard/admin/AdminHeroDemoPath";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IntegrationStatus } from "@/components/dashboard/IntegrationStatus";
import { PharmaPayerStubPanel } from "@/components/dashboard/precision-health/PharmaPayerStubPanel";

export default function AdminIntegrationsPage() {
  return (
    <DashboardShell role="admin" title="Integrations">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <AdminHeroDemoPath />
        <p className="text-xs text-muted" data-testid="admin-integrations-honesty">
          Designed for the EHR via BRIDGE FHIR staging · liveEmis:false · no live
          write-back. Partner checklist + Precision Health scaffolding:{" "}
          <Link
            href="/dashboard/admin/precision-health"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            partner readiness
          </Link>
          .
        </p>
        <IntegrationStatus />
        <PharmaPayerStubPanel />
      </div>
    </DashboardShell>
  );
}
