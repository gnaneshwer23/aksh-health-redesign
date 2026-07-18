"use client";

import type { ReactNode } from "react";

import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPharmacyLabel } from "@/lib/profile/personalization";

export default function PharmacistDashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const pharmacyLabel = getPharmacyLabel(profile);

  return (
    <DashboardShell role="pharmacist" title="Pharmacist Dashboard" organisation={pharmacyLabel} showFirstRun>
      <div className="overflow-y-auto p-4 space-y-6">
        <ConsentBanner />
        {children}
      </div>
    </DashboardShell>
  );
}
