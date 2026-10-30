"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { ConnectedDiabetesOrchestrationWorkspace } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesOrchestrationWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectedDiabetesSurface } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesSurface";
import { getPatientById } from "@/lib/mock-data";

/**
 * Connected diabetes orchestration entry — INT-01 single pipeline path.
 * Synthetic demo only; ehrWrite stays false; LIVE_ORGANISATIONS=0.
 * Not clinically validated.
 */
export default function GpConnectedDiabetesPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patient = getPatientById(params.id);
  if (!patient) notFound();

  return (
    <DashboardShell role="gp" title={`${patient.name} · Connected diabetes`}>
      <ConnectedDiabetesSurface>
        <ConnectedDiabetesOrchestrationWorkspace
          patientId={patient.id}
          patientLabel={patient.name}
        />
      </ConnectedDiabetesSurface>
    </DashboardShell>
  );
}
