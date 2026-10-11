"use client";

import { PatientCompanion } from "@/components/dashboard/PatientCompanion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LinkedNetworkPatientView, UnlinkedPatientView } from "@/components/dashboard/patient/SelfServePatientViews";
import { useRealWorkspace } from "@/components/workspace/WorkspaceMode";
import { useUserProfile } from "@/lib/hooks/use-user-profile";

export default function PatientDashboardPage() {
  const { profile, loading } = useUserProfile();
  const patientTitle = profile?.fullName?.trim() ? `${profile.fullName}'s Health` : "My Health";
  const preferences = profile?.preferences ?? {};
  // Self-serve accounts (created through sign-up) never fall back to another patient's demo chart.
  // The real workspace never shows the sample patient companion.
  const real = useRealWorkspace();
  const selfServe = real || preferences.workspace === "synthetic";
  const bound = typeof preferences.boundPatientId === "string" ? preferences.boundPatientId : null;

  return (
    <DashboardShell role="patient" title={loading ? "My Health" : patientTitle} hideSidebar hideSearch showFirstRun>
      {loading ? null : selfServe ? (
        // The shell's main area does not scroll; self-serve views bring their own scroll container (mobile).
        <div className="min-h-0 flex-1 overflow-y-auto">
          {bound ? <LinkedNetworkPatientView /> : <UnlinkedPatientView name={profile?.fullName} />}
        </div>
      ) : (
        <PatientCompanion />
      )}
    </DashboardShell>
  );
}
