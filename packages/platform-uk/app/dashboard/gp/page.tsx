"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { useSession } from "next-auth/react";

import { AgentControlPanel } from "@/components/dashboard/AgentControlPanel";
import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DemoDataBanner } from "@/components/dashboard/DemoDataBanner";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { GpHeroDemoPath } from "@/components/dashboard/GpHeroDemoPath";
import { Neo4jMockModeBanner } from "@/components/dashboard/Neo4jMockModeBanner";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { PatientPanel } from "@/components/dashboard/PatientPanel";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { Input } from "@/components/ui/input";
import { useNeo4jGuardian, useNeo4jPatient } from "@/lib/hooks/use-neo4j-clinical";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import {
  countAwaitingApproval,
  getPatientById,
  getPathwaysForPatient,
  searchPatients,
  todaysAppointments,
} from "@/lib/mock-data";
import { buildEmptyStateMessage, filterGpPatientsForProfile } from "@/lib/profile/personalization";
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
  const { status } = useSession();
  const { selectedPatientId, setSelectedPatient, writtenToRecordToday, reviewQueueItems } = useDashboardStore();
  const { profile } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWritten, setShowWritten] = useState(true);
  const [mobilePatientsOpen, setMobilePatientsOpen] = useState(true);
  const isPublicDemo = status === "unauthenticated";

  const scopedAppointments = useMemo(
    () => filterGpPatientsForProfile(todaysAppointments, profile),
    [profile]
  );
  const patient = getPatientById(selectedPatientId ?? scopedAppointments[0]?.id ?? "P002");
  const { data: oracleData, loading: oracleLoading, source: oracleSource } = useNeo4jPatient(selectedPatientId ?? patient?.id);
  const { data: guardianData, loading: guardianLoading } = useNeo4jGuardian(selectedPatientId ?? patient?.id);

  const searchResults = useMemo(() => {
    const results = searchQuery ? searchPatients(searchQuery) : [];
    return results.length > 0 ? filterGpPatientsForProfile(results, profile) : [];
  }, [searchQuery, profile]);
  const displayPatients = searchResults.length > 0 ? searchResults : scopedAppointments;
  const pathways = patient ? getPathwaysForPatient(patient.id) : [];
  const guardianCount = reviewQueueItems.filter((r) => r.agentType === "GUARDIAN" && (r.status === "Pending" || r.status === "Edited")).length;

  const oracleScore = oracleData?.oracleScore ?? patient?.oracleScore ?? 0;
  const oracleRisk = oracleData?.oracleRisk ?? patient?.oracleRisk ?? "Low";
  const displayConditions = oracleData?.conditions ?? patient?.activeConditions ?? [];
  const clinicalLoading = oracleLoading && !oracleData;

  return (
    <DashboardShell role="gp" title="Clinician Dashboard" showFirstRun>
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        {/* Mobile patient strip — collapsible, horizontal scroll */}
        <div className="shrink-0 border-b border-border-subtle bg-card lg:hidden">
          <div className="p-3">
            <ConsentBanner />
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between border-t border-border-subtle px-4 py-2.5 text-left text-sm font-semibold text-foreground"
            onClick={() => setMobilePatientsOpen((open) => !open)}
            aria-expanded={mobilePatientsOpen}
          >
            <span>Today&apos;s patients ({displayPatients.length})</span>
            {mobilePatientsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
            )}
          </button>
          {mobilePatientsOpen ? (
            <div className="space-y-3 border-t border-border-subtle p-3">
              {displayPatients.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border-subtle p-4 text-center text-xs text-muted">
                  {buildEmptyStateMessage(profile, "patients", "No patients scheduled for today.")}
                </p>
              ) : (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
                  {displayPatients.map((p) => (
                    <div key={p.id} className="w-56 shrink-0">
                      <PatientCard
                        patient={p}
                        selected={selectedPatientId === p.id}
                        onClick={() => setSelectedPatient(p.id)}
                        showTime
                      />
                    </div>
                  ))}
                </div>
              )}
              <Input
                className="rounded-xl border-border-subtle bg-surface-muted shadow-none"
                placeholder="Search by name or NHS number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden w-sidebar shrink-0 flex-col border-r border-border-subtle/70 bg-card/90 lg:flex">
          <div className="p-4">
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
            embedded
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex-1 space-y-6 overflow-y-auto bg-transparent p-4 sm:p-6">
          {isPublicDemo ? <DemoDataBanner surface="GP" className="mb-4" /> : null}
          <Neo4jMockModeBanner source={oracleSource} loading={oracleLoading} showLive />
          <GpHeroDemoPath />
          {patient && (
            <header className="dashboard-card p-6">
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
                      14-day admission risk: {oracleData?.admissionRisk14Days ?? patient.digitalTwinPrediction.admissionRisk14Days}%. {(oracleData?.riskFactors ?? patient.digitalTwinPrediction.deteriorationSignals)[0]}
                    </p>
                    {(() => {
                      const vitals = oracleData?.vitals ?? patient.vitals ?? null;
                      if (!vitals) return null;
                      return (
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                          <span>BP {vitals.bloodPressure}</span>
                          <span>HR {vitals.heartRate} bpm</span>
                          <span>SpO₂ {vitals.spo2}%</span>
                          <span>RR {vitals.respiratoryRate}/min</span>
                          <span>Temp {vitals.temperature}°C</span>
                          <span className="text-muted/70">Recorded {vitals.recordedAt}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <RiskScoreBadge score={oracleScore} risk={oracleRisk} size="lg" />
                </div>
              )}
            </header>
          )}

          <ReviewQueue patientId={selectedPatientId} queueLabel={profile?.fullName ? `${profile.fullName}'s queue` : undefined} />

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
          {patient ? (
            <p className="text-xs text-muted">
              Full Phase 1–3 panels (timeline, health-plan draft, consent grants) open on{" "}
              <Link
                href={`/dashboard/gp/patients/${patient.id}`}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {patient.name}&apos;s patient view
              </Link>
              .
            </p>
          ) : null}
          </div>

          <div className="shrink-0 overflow-x-auto bg-card lg:w-72 lg:overflow-y-auto">
            <AgentControlPanel
              patient={patient ?? null}
              oracleData={oracleData}
              guardianData={guardianData}
              oracleLoading={oracleLoading}
              guardianLoading={guardianLoading}
              className="w-full min-w-[280px] lg:w-72"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
