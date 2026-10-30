"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { ConnectedPatientChrome } from "@/components/dashboard/diabetes-intelligence/ConnectedPatientChrome";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PatientTimelinePanel } from "@/components/dashboard/precision-health/PatientTimelinePanel";
import { getPatientById } from "@/lib/mock-data";

/**
 * Longitudinal timeline page for Connected Diabetes Intelligence.
 * Fixes INT-06 (Continuous Care linked here; page was missing).
 */
export default function GpPatientTimelinePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const patient = getPatientById(params.id);
  if (!patient) notFound();

  return (
    <DashboardShell role="gp" title={`${patient.name} · Timeline`}>
      <div className="space-y-6 overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <ConnectedPatientChrome
          patientId={patient.id}
          patientLabel={patient.name}
          activeStep="timeline"
          subtitle="Merged journey + continuous care + precision-health events (synthetic)"
        />
        <PatientTimelinePanel patientId={patient.id} />
      </div>
    </DashboardShell>
  );
}
