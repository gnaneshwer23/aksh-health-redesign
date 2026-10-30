"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { Patient360Workspace } from "@/components/dashboard/patient-intelligence/Patient360Workspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectedDiabetesSurface } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesSurface";
import { getPatientById } from "@/lib/mock-data";

export default function Patient360Page(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patientId = params.id?.trim();
  if (!patientId) notFound();

  const patient = getPatientById(patientId);
  const label = patient?.name;

  return (
    <DashboardShell role="gp" title={label ? `${label} · Patient 360` : "Patient 360"}>
      <ConnectedDiabetesSurface>
        <Patient360Workspace patientId={patientId} patientLabel={label} />
      </ConnectedDiabetesSurface>
    </DashboardShell>
  );
}
