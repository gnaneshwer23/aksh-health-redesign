"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OrganisationWorkspace } from "@/components/organisation/OrganisationWorkspace";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin", "ics-lead": "ics" };

export default function OrganisationPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "gp";
  return (
    <DashboardShell role={role} title="Organisation" hideSearch honesty={{ surface: "Organisation" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <OrganisationWorkspace />
      </div>
    </DashboardShell>
  );
}
