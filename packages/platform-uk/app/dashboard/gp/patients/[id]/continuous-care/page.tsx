"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { ContinuousCareWorkspace } from "@/components/dashboard/diabetes-intelligence/ContinuousCareWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectedDiabetesSurface } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesSurface";
import { getPatientById } from "@/lib/mock-data";

export default function ContinuousCarePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patientId = params.id?.trim();
  if (!patientId) notFound();

  const patient = getPatientById(patientId);
  const label = patient?.name;

  return (
    <DashboardShell
      role="gp"
      title={label ? `${label} · Continuous care` : "Continuous care"}
    >
      <ConnectedDiabetesSurface>
        <ContinuousCareWorkspace patientId={patientId} patientLabel={label} />
      </ConnectedDiabetesSurface>
    </DashboardShell>
  );
}
