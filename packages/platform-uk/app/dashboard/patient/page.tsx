"use client";

import { PatientCompanion } from "@/components/dashboard/PatientCompanion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

export default function PatientDashboardPage() {
  const { profile, loading } = useUserProfile();
  const patientTitle = profile?.fullName?.trim() ? `${profile.fullName}'s Health` : "My Health";

  return (
    <DashboardShell role="patient" title={loading ? "My Health" : patientTitle} hideSidebar hideSearch showFirstRun>
      <PatientCompanion />
    </DashboardShell>
  );
}
