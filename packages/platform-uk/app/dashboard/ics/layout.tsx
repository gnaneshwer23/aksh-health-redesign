"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IcsDataProvider, useIcsData } from "@/components/dashboard/ics/IcsDataContext";
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
    <DashboardShell
      role="ics"
      title={icsTitle}
      organisation={profile?.organisation}
      showFirstRun
      honesty={{
        surface: "ICS",
        // Public demo: keep honesty strip synthetic-only (no Neo4j mock/live chips).
        neo4jSource: isPublicDemo ? null : source,
        neo4jLoading: isPublicDemo ? false : loading,
        showNeo4jLive: !isPublicDemo,
      }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ConsentBanner className="flex-1" />
          <Select value={icsDateRange} onValueChange={(v) => setIcsDateRange(v as typeof icsDateRange)}>
            <SelectTrigger className="w-32" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="12m">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
