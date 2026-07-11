"use client";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PilotApplicationsPanel } from "@/components/dashboard/PilotApplicationsPanel";

export default function AdminPilotApplicationsPage() {
  return (
    <DashboardShell role="admin" title="ICS Pilot Applications">
      <div className="space-y-4 overflow-y-auto p-4">
        <ConsentBanner />
        <PilotApplicationsPanel />
      </div>
    </DashboardShell>
  );
}
