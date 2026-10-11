"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TodayView } from "@/components/workspace/TodayView";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin" };

export default function TodayPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "admin";
  return (
    <DashboardShell role={role} title="Today" hideSearch>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TodayView name={session?.user?.name} />
      </div>
    </DashboardShell>
  );
}
