"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DemoDataBanner } from "@/components/dashboard/DemoDataBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IcsDataProvider, useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { Neo4jMockModeBanner } from "@/components/dashboard/Neo4jMockModeBanner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function IcsLayoutHeader({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const { icsDateRange, setIcsDateRange } = useDashboardStore();
  const { data, source, loading } = useIcsData();
  const { profile } = useUserProfile();
  const icsTitle = profile?.organisation ?? data.icsName;
  const isPublicDemo = status === "unauthenticated";

  return (
    <DashboardShell role="ics" title={icsTitle} organisation={profile?.organisation} showFirstRun>
      <div className="overflow-y-auto p-4 space-y-6">
        {isPublicDemo ? <DemoDataBanner surface="ICS" /> : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ConsentBanner className="flex-1" />
          <Select value={icsDateRange} onValueChange={(v) => setIcsDateRange(v as typeof icsDateRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Live/mock Neo4j banners only for signed-in ICS — public demo stays synthetic. */}
        {!isPublicDemo ? (
          <Neo4jMockModeBanner source={source} loading={loading} showLive />
        ) : null}
        {children}
      </div>
    </DashboardShell>
  );
}

export default function IcsDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <IcsDataProvider>
      <IcsLayoutHeader>{children}</IcsLayoutHeader>
    </IcsDataProvider>
  );
}
