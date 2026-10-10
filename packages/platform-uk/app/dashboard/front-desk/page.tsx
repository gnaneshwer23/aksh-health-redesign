"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FrontDeskConsole } from "@/components/front-desk/FrontDeskConsole";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = { gp: "gp", nurse: "nurse", "practice-manager": "admin" };

export default function FrontDeskPage() {
  // Role comes from the session (available immediately), not the profile fetch: rendering the
  // admin shell first made GP and nurse sessions call admin-only APIs (401).
  // Public demo viewers and unknown roles get the GP shell, whose sidebar calls no admin-only APIs.
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "gp";
  return (
    <DashboardShell role={role} title="Front Desk" hideSearch honesty={{ surface: "Front Desk" }}>
      <div className="flex-1 overflow-y-auto">
        <FrontDeskConsole />
      </div>
    </DashboardShell>
  );
}
