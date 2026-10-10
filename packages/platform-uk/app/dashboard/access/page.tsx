"use client";

import { useSession } from "next-auth/react";

import { SlotFillConsole } from "@/components/access/SlotFillConsole";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin" };

export default function SlotFillPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "admin";
  return (
    <DashboardShell role={role} title="Fill cancelled slots" hideSearch honesty={{ surface: "Slot fill" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <SlotFillConsole />
      </div>
    </DashboardShell>
  );
}
