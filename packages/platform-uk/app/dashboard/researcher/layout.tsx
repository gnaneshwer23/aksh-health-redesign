"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ResearcherDataProvider } from "@/components/dashboard/researcher/ResearcherDataContext";

export default function ResearcherDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ResearcherDataProvider>
      <DashboardShell role="researcher" title="Researcher Dashboard" showFirstRun>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <ConsentBanner />
          {children}
        </div>
      </DashboardShell>
    </ResearcherDataProvider>
  );
}
