"use client";

import type { ReactNode } from "react";

import { AskAkshDrawer } from "@/components/chat/AskAkshDrawer";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NursePatientList } from "@/components/dashboard/nurse/NursePatientList";
import { VoiceCareEscalationCard } from "@/components/dashboard/nurse/VoiceCareEscalationCard";
import { useNeo4jGuardian } from "@/lib/hooks/use-neo4j-clinical";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";
import { PRACTICE_NAME, patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function NurseDashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const orgLabel = getPersonalizedLabel(profile, PRACTICE_NAME);
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient =
    patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0] ?? null;
  const { source: neo4jSource, loading: neo4jLoading } = useNeo4jGuardian(
    selectedPatientId ?? patient?.id ?? "P001"
  );

  return (
    <DashboardShell
      role="nurse"
      title="Nurse Dashboard"
      organisation={orgLabel}
      showFirstRun
      honesty={{
        surface: "Nurse",
        neo4jSource,
        neo4jLoading,
        showNeo4jLive: true,
      }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-3">
          <div className="min-w-0 flex-1">
            <VoiceCareEscalationCard />
          </div>
          <AskAkshDrawer
            patientId={selectedPatientId ?? patient?.id ?? null}
            patientLabel={patient?.name}
            triggerTestId="nurse-ask-aksh-trigger"
            drawerTestId="nurse-ask-aksh-drawer"
          />
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <NursePatientList />
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}
