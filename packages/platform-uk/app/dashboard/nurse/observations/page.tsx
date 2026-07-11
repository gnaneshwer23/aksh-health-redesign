"use client";

import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
import { VitalsForm } from "@/components/dashboard/nurse/VitalsForm";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { getPersonalizedLabel } from "@/lib/profile/personalization";
import { PRACTICE_NAME } from "@/lib/mock-data";

export default function NurseObservationsPage() {
  const { profile } = useUserProfile();
  const orgLabel = getPersonalizedLabel(profile, PRACTICE_NAME);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-secondary">Observations</h2>
        <p className="text-sm text-muted">Vitals and alerts for {orgLabel}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <NursePatientHeader />
          <VitalsForm />
        </div>
        <GuardianAlertsPanel scope="selected" />
      </div>
    </div>
  );
}
