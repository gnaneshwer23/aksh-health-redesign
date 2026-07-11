"use client";

import type { ReactNode } from "react";

import { CommandHeader } from "@/components/dashboard/hospital/CommandHeader";
import { SurgeAlertBanner } from "@/components/dashboard/hospital/SurgeAlertBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="hospital" title="Command Centre">
      <div className="flex flex-col h-full overflow-hidden">
        <CommandHeader data={hospitalData} />
        <SurgeAlertBanner data={hospitalData} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </DashboardShell>
  );
}
