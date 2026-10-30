"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { AgentIntelligenceWorkspace } from "@/components/dashboard/diabetes-intelligence/AgentIntelligenceWorkspace";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ConnectedDiabetesSurface } from "@/components/dashboard/diabetes-intelligence/ConnectedDiabetesSurface";
import { getPatientById } from "@/lib/mock-data";

export default function AgentIntelligencePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patientId = params.id?.trim();
  if (!patientId) notFound();

  const patient = getPatientById(patientId);
  const label = patient?.name;

  return (
    <DashboardShell
      role="gp"
      title={label ? `${label} · Agent intelligence` : "Agent intelligence"}
    >
      <ConnectedDiabetesSurface>
        <AgentIntelligenceWorkspace patientId={patientId} patientLabel={label} />
      </ConnectedDiabetesSurface>
    </DashboardShell>
  );
}
