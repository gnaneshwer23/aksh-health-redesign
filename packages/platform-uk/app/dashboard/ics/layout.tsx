"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { IcsDataProvider, useIcsData } from "@/components/dashboard/ics/IcsDataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function IcsLayoutHeader({ children }: { children: ReactNode }) {
  const { icsDateRange, setIcsDateRange } = useDashboardStore();
  const { data } = useIcsData();

  return (
    <DashboardShell role="ics" title={data.icsName}>
      <div className="overflow-y-auto p-4 space-y-6">
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
