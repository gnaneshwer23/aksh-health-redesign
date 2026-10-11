"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TwoStepSetup } from "@/components/security/TwoStepSetup";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = {
  gp: "gp", nurse: "nurse", "clinical-pharmacist": "pharmacist", "practice-manager": "admin", "ics-lead": "ics",
  "hospital-executive": "hospital", researcher: "researcher", patient: "patient",
};

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "admin";
  // Wait for the session: otherwise every role briefly gets the admin layout.
  if (status === "loading") return <p className="p-6 text-sm text-muted">Loading…</p>;
  return (
    <DashboardShell role={role} title="Security" hideSearch hideSidebar={role === "patient"}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <TwoStepSetup />
      </div>
    </DashboardShell>
  );
}
