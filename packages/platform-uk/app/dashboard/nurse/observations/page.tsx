"use client";

import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
import { VitalsForm } from "@/components/dashboard/nurse/VitalsForm";

export default function NurseObservationsPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <NursePatientHeader />
        <VitalsForm />
      </div>
      <GuardianAlertsPanel scope="selected" />
    </div>
  );
}
