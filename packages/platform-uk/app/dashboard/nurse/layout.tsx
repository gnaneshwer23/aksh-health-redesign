"use client";

import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NursePatientList } from "@/components/dashboard/nurse/NursePatientList";
import { VoiceCareEscalationCard } from "@/components/dashboard/nurse/VoiceCareEscalationCard";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";
import { PRACTICE_NAME } from "@/lib/mock-data";

export default function NurseDashboardLayout({ children }: { children: ReactNode }) {
  const { profile } = useUserProfile();
  const orgLabel = getPersonalizedLabel(profile, PRACTICE_NAME);

  return (
    <DashboardShell role="nurse" title="Nurse Dashboard" organisation={orgLabel}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 px-4 pt-4">
          <VoiceCareEscalationCard />
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <NursePatientList />
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}
