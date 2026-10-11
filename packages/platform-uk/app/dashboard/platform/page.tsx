"use client";

import { useSession } from "next-auth/react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { GoLiveReview } from "@/components/platform/GoLiveReview";
import type { DashboardRole } from "@/lib/zustand/dashboardStore";

const ROLE_FOR_SHELL: Record<string, DashboardRole> = {
  gp: "gp",
  nurse: "nurse",
  "clinical-pharmacist": "pharmacist",
  "practice-manager": "admin",
  "ics-lead": "ics",
  "hospital-executive": "hospital",
  researcher: "researcher",
  patient: "patient",
};

export default function PlatformReviewPage() {
  const { data: session } = useSession();
  const sessionRole = session?.user?.role as string | undefined;
  const role: DashboardRole = (sessionRole && ROLE_FOR_SHELL[sessionRole]) || "admin";
  return (
    <DashboardShell role={role} title="Go-live reviews" hideSearch honesty={{ surface: "Go-live reviews" }}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <GoLiveReview />
      </div>
    </DashboardShell>
  );
}
