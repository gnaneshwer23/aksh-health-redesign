"use client";

import type { ReactNode } from "react";

import { CommandHeader } from "@/components/dashboard/hospital/CommandHeader";
import { SurgeAlertBanner } from "@/components/dashboard/hospital/SurgeAlertBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalDashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const hospitalName = profile?.organisation ?? hospitalData.hospitalName;

  return (
    <DashboardShell
      role="hospital"
      title="Command Centre"
      organisation={hospitalName}
      showFirstRun
      honesty={{ surface: "Hospital" }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <CommandHeader data={hospitalData} hospitalName={hospitalName} />
        <SurgeAlertBanner data={hospitalData} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </DashboardShell>
  );
}
