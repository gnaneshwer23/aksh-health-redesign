"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";

import { PilotReadout } from "@/components/access/PilotReadout";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin" };

function FromQuery() {
  const q = useSearchParams();
  return <PilotReadout initialOrgId={q.get("org") ?? undefined} />;
}

export default function PilotReportPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "admin";
  return (
    <DashboardShell role={role} title="Pilot readout" hideSearch honesty={{ surface: "Slot fill" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={null}><FromQuery /></Suspense>
      </div>
    </DashboardShell>
  );
}
