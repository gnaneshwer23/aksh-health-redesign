"use client";

import type { ReactNode } from "react";

import { AskAkshDrawer } from "@/components/chat/AskAkshDrawer";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useNeo4jGuardian } from "@/lib/hooks/use-neo4j-clinical";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPatientById } from "@/lib/mock-data";
import { getPharmacyLabel } from "@/lib/profile/personalization";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function PharmacistDashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const pharmacyLabel = getPharmacyLabel(profile);
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const { source: neo4jSource, loading: neo4jLoading } = useNeo4jGuardian(
    selectedPatientId ?? "P002"
  );

  return (
    <DashboardShell
      role="pharmacist"
      title="Pharmacist Dashboard"
      organisation={pharmacyLabel}
      showFirstRun
      honesty={{
        surface: "Pharmacist",
        neo4jSource,
        neo4jLoading,
        showNeo4jLive: true,
      }}
    >
      <div className="space-y-4 overflow-y-auto p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <ConsentBanner />
          </div>
          <AskAkshDrawer
            patientId={selectedPatientId}
            patientLabel={patient?.name}
            triggerTestId="pharmacist-ask-aksh-trigger"
            drawerTestId="pharmacist-ask-aksh-drawer"
          />
        </div>
        {children}
      </div>
    </DashboardShell>
  );
}
