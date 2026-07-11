"use client";

import { useEffect } from "react";

import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function NurseAlertsPage() {
  const setNurseFilter = useDashboardStore((s) => s.setNurseFilter);

  useEffect(() => {
    setNurseFilter("alerts");
  }, [setNurseFilter]);

  return (
    <div className="space-y-4">
      <NursePatientHeader />
      <GuardianAlertsPanel scope="filtered" />
    </div>
  );
}
