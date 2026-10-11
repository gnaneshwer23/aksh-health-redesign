"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CareNetworkConsole } from "@/components/network/CareNetworkConsole";
import { ReadingsReview } from "@/components/network/ReadingsReview";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin", "ics-lead": "ics" };

export default function CareNetworkPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "gp";
  return (
    <DashboardShell role={role} title="Care network" hideSearch honesty={{ surface: "Care network" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ReadingsReview />
        <CareNetworkConsole />
      </div>
    </DashboardShell>
  );
}
