"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { DiabetesGlucoseIntelligenceWorkspace } from "@/components/dashboard/diabetes-intelligence/DiabetesGlucoseIntelligenceWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getPatientById } from "@/lib/mock-data";

export default function DiabetesIntelligencePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patientId = params.id?.trim();
  if (!patientId) notFound();

  const patient = getPatientById(patientId);
  const label = patient?.name;

  return (
    <DashboardShell
      role="gp"
      title={label ? `${label} · Glucose intelligence` : "Glucose intelligence"}
    >
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <DiabetesGlucoseIntelligenceWorkspace patientId={patientId} patientLabel={label} />
      </div>
    </DashboardShell>
  );
}
