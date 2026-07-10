"use client";

import { PatientCompanion } from "@/components/dashboard/PatientCompanion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function PatientDashboardPage() {
  return (
    <DashboardShell role="patient" title="Health Companion" hideSidebar>
      <PatientCompanion />
    </DashboardShell>
  );
}
