"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";

import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { OracleRiskPanel } from "@/components/dashboard/OracleRiskPanel";
import { CausalHypothesisPanel } from "@/components/dashboard/precision-health/CausalHypothesisPanel";
import { ClinicalOrchestratePanel } from "@/components/dashboard/precision-health/ClinicalOrchestratePanel";
import { ConnectorsIngestPanel } from "@/components/dashboard/precision-health/ConnectorsIngestPanel";
import { ConsentGrantsPanel } from "@/components/dashboard/precision-health/ConsentGrantsPanel";
import { HealthPlanDraftPanel } from "@/components/dashboard/precision-health/HealthPlanDraftPanel";
import { PatientStatePanel } from "@/components/dashboard/precision-health/PatientStatePanel";
import { PatientTimelinePanel } from "@/components/dashboard/precision-health/PatientTimelinePanel";
import { ScenarioRankingPanel } from "@/components/dashboard/precision-health/ScenarioRankingPanel";
import { SpineOutcomesCapturePanel } from "@/components/dashboard/precision-health/SpineOutcomesCapturePanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { Button } from "@/components/ui/button";
import { getPatientById, getPathwaysForPatient } from "@/lib/mock-data";
import type { TwinSimulationResult } from "@/lib/precision-health/twin-simulation";

export default function GpPatientDetailPage({ params }: { params: { id: string } }) {
  const [timelineRefreshKey, setTimelineRefreshKey] = useState(0);
  const [twinSeed, setTwinSeed] = useState<TwinSimulationResult | null>(null);
  const patient = getPatientById(params.id);
  if (!patient) notFound();

  const pathways = getPathwaysForPatient(patient.id);

  return (
    <DashboardShell role="gp" title={patient.name}>
      <div className="space-y-6 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/gp/patients">← Back to patients</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/gp/review-queue?patient=${patient.id}`}>Open review queue</Link>
          </Button>
        </div>

        <header className="dashboard-card border-border-subtle p-6 shadow-sm">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{patient.name}</h1>
              <p className="text-sm text-muted">
                NHS {patient.nhsNumber} · {patient.gender} · Age {patient.age}
              </p>
              <p className="mt-1 text-sm text-muted">
                {patient.postcode} · Last encounter: {patient.lastEncounterDate}
              </p>
              {patient.vitals && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                  <span>BP {patient.vitals.bloodPressure}</span>
                  <span>HR {patient.vitals.heartRate} bpm</span>
                  <span>SpO₂ {patient.vitals.spo2}%</span>
                  <span>RR {patient.vitals.respiratoryRate}/min</span>
                  <span>Temp {patient.vitals.temperature}°C</span>
                  <span className="text-muted/70">
                    Recorded {patient.vitals.recordedAt} · {patient.vitals.recordedBy}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} size="lg" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">HORIZON</span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-muted">Conditions</p>
              <ul className="mt-1 text-sm">
                {patient.activeConditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Medications</p>
              <ul className="mt-1 text-sm">
                {patient.activeMedications.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Allergies</p>
              <ul className="mt-1 text-sm">
                {patient.allergies.length > 0 ? (
                  patient.allergies.map((a) => <li key={a}>{a}</li>)
                ) : (
                  <li className="text-muted">None recorded</li>
                )}
              </ul>
            </div>
          </div>
        </header>

        <ClinicalOrchestratePanel
          patientId={patient.id}
          patientLabel={patient.name}
          onComplete={({ twin }) => setTwinSeed(twin)}
        />
        <OracleRiskPanel
          patientId={patient.id}
          patientName={patient.name}
          fallbackScore={patient.oracleScore}
          fallbackRisk={patient.oracleRisk}
        />
        <ReviewQueue patientId={patient.id} />
        <section>
          <h2 className="mb-3 text-base font-semibold">Care Pathways</h2>
          <CarePathwayTracker pathways={pathways} />
        </section>
        <DigitalTwinPanel patient={patient} />
        <ScenarioRankingPanel
          patientId={patient.id}
          patientLabel={patient.name}
          seedFromOrchestrate={twinSeed}
        />
        <CausalHypothesisPanel patientId={patient.id} patientLabel={patient.name} />
        <HealthPlanDraftPanel patientId={patient.id} patientLabel={patient.name} />
        <SpineOutcomesCapturePanel
          patientId={patient.id}
          patientLabel={patient.name}
          mode="clinician"
          onCaptured={() => setTimelineRefreshKey((k) => k + 1)}
        />
        <ConnectorsIngestPanel
          patientId={patient.id}
          patientLabel={patient.name}
          mode="clinician"
          onIngestSuccess={() => setTimelineRefreshKey((k) => k + 1)}
        />
        <PatientTimelinePanel
          patientId={patient.id}
          patientLabel={patient.name}
          refreshKey={timelineRefreshKey}
        />
        <PatientStatePanel
          patientId={patient.id}
          patientLabel={patient.name}
          refreshKey={timelineRefreshKey}
        />
        <ConsentGrantsPanel patientId={patient.id} patientLabel={patient.name} mode="clinician" />
      </div>
    </DashboardShell>
  );
}
