"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { AgentControlPanel } from "@/components/dashboard/AgentControlPanel";
import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { PatientPanel } from "@/components/dashboard/PatientPanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import {
  countAwaitingApproval,
  getPatientById,
  getPathwaysForPatient,
  reviewQueueItems,
  searchPatients,
  todaysAppointments,
} from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function GpDashboardPage() {
  const { selectedPatientId, setSelectedPatient, writtenToRecordToday } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWritten, setShowWritten] = useState(true);

  const patient = getPatientById(selectedPatientId ?? "P002");
  const searchResults = useMemo(() => (searchQuery ? searchPatients(searchQuery) : []), [searchQuery]);
  const displayPatients = searchResults.length > 0 ? searchResults : todaysAppointments;
  const pathways = patient ? getPathwaysForPatient(patient.id) : [];
  const guardianCount = reviewQueueItems.filter((r) => r.agentType === "GUARDIAN" && r.status === "Pending").length;

  return (
    <DashboardShell role="gp" title="Clinician Dashboard">
      <div className="flex h-full overflow-hidden">
        <div className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
          <div className="p-3">
            <ConsentBanner />
          </div>
          <PatientPanel
            patients={displayPatients}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatient}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            pathwayApprovalCount={countAwaitingApproval()}
            guardianAlertCount={guardianCount}
          />
        </div>

        <div className="flex-1 overflow-y-auto bg-background p-4 space-y-4">
          {patient && (
            <header className="rounded-sm border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-lg font-semibold">{patient.name}</h1>
                  <p className="text-xs text-muted">NHS {patient.nhsNumber} · DOB {patient.dob} · Age {patient.age}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {patient.activeConditions.map((c) => (
                      <span key={c} className="rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{c}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {patient.activeMedications.length} medications · Last seen: {patient.lastEncounterDate}
                    {patient.nextAppointmentDate && ` · Next: ${patient.nextAppointmentDate}`}
                  </p>
                  <p className="mt-1 text-xs font-medium text-warning">
                    14-day admission risk: {patient.digitalTwinPrediction.admissionRisk14Days}% — {patient.digitalTwinPrediction.deteriorationSignals[0]}
                  </p>
                </div>
                <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} size="lg" />
              </div>
            </header>
          )}

          <ReviewQueue patientId={selectedPatientId} />

          <section>
            <button type="button" className="flex items-center gap-2 text-sm font-semibold" onClick={() => setShowWritten(!showWritten)}>
              <Check className="h-4 w-4 text-accent" /> Written to Record ({writtenToRecordToday.length})
            </button>
            {showWritten && writtenToRecordToday.length > 0 && (
              <div className="mt-2 space-y-2">
                {writtenToRecordToday.map((item) => (
                  <div key={item.id} className="rounded-sm border border-accent/30 bg-accent/5 p-3 text-xs">
                    <p className="font-medium text-accent">✓ {item.title}</p>
                    <p className="text-muted">{item.acceptedBy} · {item.acceptedAt && new Date(item.acceptedAt).toLocaleString("en-GB")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Care Pathway Progress</h2>
            <CarePathwayTracker pathways={pathways} />
          </section>

          <DigitalTwinPanel patient={patient ?? null} />
        </div>

        <AgentControlPanel patient={patient ?? null} />
      </div>
    </DashboardShell>
  );
}
