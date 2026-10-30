"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { ConnectedDiabetesOrchestrationWorkspace } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesOrchestrationWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
      <div className="space-y-6 overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <ConnectedDiabetesOrchestrationWorkspace
          patientId={patient.id}
          patientLabel={patient.name}
        />
      </div>
    </DashboardShell>
  );
}
