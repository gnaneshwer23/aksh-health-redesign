"use client";

import { useSession } from "next-auth/react";

import { MonitoringList } from "@/components/cgm/MonitoringList";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist" };

export default function MonitoringPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "gp";
  return (
    <DashboardShell role={role} title="CGM monitoring" hideSearch honesty={{ surface: "CGM monitoring" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MonitoringList />
      </div>
    </DashboardShell>
  );
}
