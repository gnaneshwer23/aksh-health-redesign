"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function PharmacistDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="pharmacist" title="Pharmacist Dashboard">
      <div className="overflow-y-auto p-4 space-y-6">
        <ConsentBanner />
        {children}
      </div>
    </DashboardShell>
  );
}
