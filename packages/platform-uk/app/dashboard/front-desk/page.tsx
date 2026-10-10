"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FrontDeskConsole } from "@/components/front-desk/FrontDeskConsole";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "practice-manager": "admin" };

export default function FrontDeskPage() {
  const { profile } = useUserProfile();
  const role = (profile?.role && ROLE_FOR_SHELL[profile.role]) || "admin";
  return (
    <DashboardShell role={role} title="Front Desk" hideSearch honesty={{ surface: "Front Desk" }}>
      <div className="flex-1 overflow-y-auto">
        <FrontDeskConsole />
      </div>
    </DashboardShell>
  );
}
