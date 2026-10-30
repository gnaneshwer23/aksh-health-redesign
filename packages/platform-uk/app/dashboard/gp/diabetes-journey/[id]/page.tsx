"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { DiabetesJourneyWorkspace } from "@/components/dashboard/diabetes-intelligence/DiabetesJourneyWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getPatientById } from "@/lib/mock-data";

export default function DiabetesJourneyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const patientId = params.id?.trim();
  if (!patientId) notFound();

  const patient = getPatientById(patientId);
  // Allow synthetic ids that are not in the mock cohort (history will show missing fields).
  const label = patient?.name;

  return (
    <DashboardShell role="gp" title={label ? `${label} · Diabetes journey` : "Diabetes journey"}>
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <DiabetesJourneyWorkspace patientId={patientId} patientLabel={label} />
      </div>
    </DashboardShell>
  );
}
