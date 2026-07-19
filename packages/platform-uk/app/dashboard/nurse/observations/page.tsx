"use client";

import { useState } from "react";

import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
import { VitalsForm } from "@/components/dashboard/nurse/VitalsForm";
import { PatientTimelinePanel } from "@/components/dashboard/precision-health/PatientTimelinePanel";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { patients, PRACTICE_NAME } from "@/lib/mock-data";
import { getPersonalizedLabel } from "@/lib/profile/personalization";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function NurseObservationsPage() {
  const { profile } = useUserProfile();
  const orgLabel = getPersonalizedLabel(profile, PRACTICE_NAME);
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-secondary">Observations</h2>
        <p className="text-sm text-muted">
          Vitals and alerts for {orgLabel} — same clinical spine timeline as GP
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <NursePatientHeader />
          <VitalsForm onSaved={() => setTimelineRefreshKey((k) => k + 1)} />
        </div>
        <div className="space-y-4">
          <GuardianAlertsPanel scope="selected" />
          <PatientTimelinePanel
            patientId={patient.id}
            patientLabel={patient.name}
            refreshKey={timelineRefreshKey}
          />
        </div>
      </div>
    </div>
  );
}
