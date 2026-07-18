"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import { CommandHeader } from "@/components/dashboard/hospital/CommandHeader";
import { HospitalMockModeBanner } from "@/components/dashboard/hospital/HospitalMockModeBanner";
import { SurgeAlertBanner } from "@/components/dashboard/hospital/SurgeAlertBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DemoDataBanner } from "@/components/dashboard/DemoDataBanner";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { hospitalData } from "@/lib/mock-data";

export default function HospitalDashboardLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const { profile } = useUserProfile();
  const hospitalName = profile?.organisation ?? hospitalData.hospitalName;
  const isPublicDemo = status === "unauthenticated";

  return (
    <DashboardShell role="hospital" title="Command Centre" organisation={hospitalName}>
      <div className="flex flex-col h-full overflow-hidden">
        <CommandHeader data={hospitalData} hospitalName={hospitalName} />
        <SurgeAlertBanner data={hospitalData} />
        <div className="space-y-2 px-4 pt-3">
          {isPublicDemo ? <DemoDataBanner surface="Hospital" /> : null}
          <HospitalMockModeBanner />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </DashboardShell>
  );
}
