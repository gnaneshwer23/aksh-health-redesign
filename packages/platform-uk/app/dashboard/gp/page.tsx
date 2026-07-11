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
import { useNeo4jGuardian, useNeo4jPatient } from "@/lib/hooks/use-neo4j-clinical";
import {
  countAwaitingApproval,
  getPatientById,
  getPathwaysForPatient,
  searchPatients,
  todaysAppointments,
} from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

function HeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 w-48 rounded bg-muted/40" />
      <div className="h-3 w-64 rounded bg-muted/30" />
      <div className="h-16 w-20 rounded-full bg-muted/20" />
    </div>
  );
}

export default function GpDashboardPage() {
  const { selectedPatientId, setSelectedPatient, writtenToRecordToday, reviewQueueItems } = useDashboardStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWritten, setShowWritten] = useState(true);

  const patient = getPatientById(selectedPatientId ?? "P002");
  const { data: oracleData, loading: oracleLoading } = useNeo4jPatient(selectedPatientId ?? patient?.id);
  const { data: guardianData, loading: guardianLoading } = useNeo4jGuardian(selectedPatientId ?? patient?.id);

  const searchResults = useMemo(() => (searchQuery ? searchPatients(searchQuery) : []), [searchQuery]);
  const displayPatients = searchResults.length > 0 ? searchResults : todaysAppointments;
  const pathways = patient ? getPathwaysForPatient(patient.id) : [];
  const guardianCount = reviewQueueItems.filter((r) => r.agentType === "GUARDIAN" && (r.status === "Pending" || r.status === "Edited")).length;

  const oracleScore = oracleData?.oracleScore ?? patient?.oracleScore ?? 0;
  const oracleRisk = oracleData?.oracleRisk ?? patient?.oracleRisk ?? "Low";
  const displayConditions = oracleData?.conditions ?? patient?.activeConditions ?? [];
  const clinicalLoading = oracleLoading && !oracleData;

  return (
    <DashboardShell role="gp" title="Clinician Dashboard">
      <div className="flex h-full overflow-hidden">
        <div className="flex w-sidebar shrink-0 flex-col border-r border-border-subtle bg-card">
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

        <div className="flex-1 space-y-5 overflow-y-auto bg-background p-5">
          {patient && (
            <header className="dashboard-card p-5">
              {clinicalLoading ? (
                <HeaderSkeleton />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">{patient.name}</h1>
                    <p className="text-xs text-muted">NHS {patient.nhsNumber} · DOB {patient.dob} · Age {patient.age}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {displayConditions.map((c) => (
                        <span key={c} className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-muted">
                      {(oracleData?.medications ?? patient.activeMedications).length} medications · Last seen: {patient.lastEncounterDate}
                      {patient.nextAppointmentDate && ` · Next: ${patient.nextAppointmentDate}`}
                    </p>
                    <p className="mt-1 text-xs font-medium text-warning">
                      14-day admission risk: {oracleData?.admissionRisk14Days ?? patient.digitalTwinPrediction.admissionRisk14Days}% — {(oracleData?.riskFactors ?? patient.digitalTwinPrediction.deteriorationSignals)[0]}
                    </p>
                  </div>
                  <RiskScoreBadge score={oracleScore} risk={oracleRisk} size="lg" />
                </div>
              )}
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
                  <div key={item.id} className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-xs shadow-sm">
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

        <AgentControlPanel
          patient={patient ?? null}
          oracleData={oracleData}
          guardianData={guardianData}
          oracleLoading={oracleLoading}
          guardianLoading={guardianLoading}
        />
      </div>
    </DashboardShell>
  );
}
