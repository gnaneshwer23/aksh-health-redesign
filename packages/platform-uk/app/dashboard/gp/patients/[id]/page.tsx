"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { Button } from "@/components/ui/button";
import { getPatientById, getPathwaysForPatient } from "@/lib/mock-data";

export default function GpPatientDetailPage({ params }: { params: { id: string } }) {
  const patient = getPatientById(params.id);
  if (!patient) notFound();

  const pathways = getPathwaysForPatient(patient.id);

  return (
    <DashboardShell role="gp" title={patient.name}>
      <div className="overflow-y-auto p-4 space-y-6">
        <Button variant="outline" size="sm" asChild><Link href="/dashboard/gp/patients">← Back to patients</Link></Button>

        <header className="rounded-sm border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{patient.name}</h1>
              <p className="text-sm text-muted">NHS {patient.nhsNumber} · {patient.gender} · Age {patient.age}</p>
              <p className="text-sm text-muted mt-1">{patient.postcode} · Last encounter: {patient.lastEncounterDate}</p>
            </div>
            <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} size="lg" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div><p className="text-xs font-semibold text-muted">Conditions</p><ul className="text-sm mt-1">{patient.activeConditions.map((c) => <li key={c}>{c}</li>)}</ul></div>
            <div><p className="text-xs font-semibold text-muted">Medications</p><ul className="text-sm mt-1">{patient.activeMedications.map((m) => <li key={m}>{m}</li>)}</ul></div>
            <div><p className="text-xs font-semibold text-muted">Allergies</p><ul className="text-sm mt-1">{patient.allergies.map((a) => <li key={a}>{a}</li>)}</ul></div>
          </div>
        </header>

        <ReviewQueue patientId={patient.id} />
        <section><h2 className="text-base font-semibold mb-3">Care Pathways</h2><CarePathwayTracker pathways={pathways} /></section>
        <DigitalTwinPanel patient={patient} />
      </div>
    </DashboardShell>
  );
}
