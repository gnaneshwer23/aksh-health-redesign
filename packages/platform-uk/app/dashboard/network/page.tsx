"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CareNetworkConsole } from "@/components/network/CareNetworkConsole";
import { ReadingsReview } from "@/components/network/ReadingsReview";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin", "ics-lead": "ics" };

export default function CareNetworkPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "gp";
  const real = useRealWorkspace();
  return (
    <DashboardShell role={role} title={real ? "Patients" : "Care network"} hideSearch honesty={{ surface: "Care network" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ReadingsReview />
        <CareNetworkConsole simple={real} />
      </div>
    </DashboardShell>
  );
}
