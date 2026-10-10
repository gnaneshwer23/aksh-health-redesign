"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Check, ChevronDown, ChevronUp } from "lucide-react";

import { AskAkshDrawer } from "@/components/chat/AskAkshDrawer";
import { AgentControlPanel } from "@/components/dashboard/AgentControlPanel";
import { CarePathwayTracker } from "@/components/dashboard/CarePathwayTracker";
import { ConsentBanner } from "@/components/dashboard/ConsentBanner";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { GpHeroDemoPath } from "@/components/dashboard/GpHeroDemoPath";
import { PatientCard } from "@/components/dashboard/PatientCard";
import { PatientPanel } from "@/components/dashboard/PatientPanel";
import { ClinicalIntelligenceWorkspace } from "@/components/dashboard/ClinicalIntelligenceWorkspace";
import { ReviewQueue } from "@/components/dashboard/ReviewQueue";
import { SimulatedEhrWrittenPanel } from "@/components/dashboard/SimulatedEhrWrittenPanel";
import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  const { selectedPatientId, setSelectedPatient, writtenToRecordToday, reviewQueueItems } =
    useDashboardStore();
  const { profile } = useUserProfile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWritten, setShowWritten] = useState(false);
  const [showSecondary, setShowSecondary] = useState(false);
  const [mobilePatientsOpen, setMobilePatientsOpen] = useState(true);
  const [agentsOpen, setAgentsOpen] = useState(false);

  const scopedAppointments = useMemo(
    () => filterGpPatientsForProfile(todaysAppointments, profile),
    [profile]
  );
  const patient = getPatientById(selectedPatientId ?? scopedAppointments[0]?.id ?? "P002");
  const {
    data: oracleData,
    loading: oracleLoading,
    source: oracleSource,
  } = useNeo4jPatient(selectedPatientId ?? patient?.id);
  const { data: guardianData, loading: guardianLoading } = useNeo4jGuardian(
    selectedPatientId ?? patient?.id
  );

  const searchResults = useMemo(() => {
    const results = searchQuery ? searchPatients(searchQuery) : [];
    return results.length > 0 ? filterGpPatientsForProfile(results, profile) : [];
  }, [searchQuery, profile]);
  const displayPatients = searchResults.length > 0 ? searchResults : scopedAppointments;
  const pathways = patient ? getPathwaysForPatient(patient.id) : [];
  const guardianCount = reviewQueueItems.filter(
    (r) => r.agentType === "GUARDIAN" && (r.status === "Pending" || r.status === "Edited")
  ).length;

  const oracleScore = oracleData?.oracleScore ?? patient?.oracleScore ?? 0;
  const oracleRisk = oracleData?.oracleRisk ?? patient?.oracleRisk ?? "Low";
  const displayConditions = oracleData?.conditions ?? patient?.activeConditions ?? [];
  const clinicalLoading = oracleLoading && !oracleData;

  return (
    <DashboardShell
      role="gp"
      title="Clinician Dashboard"
      showFirstRun
      honesty={{
        surface: "GP",
        neo4jSource: oracleSource,
        neo4jLoading: oracleLoading,
        showNeo4jLive: true,
      }}
    >
      <div className="flex h-full flex-col overflow-hidden lg:flex-row">
        {/* Mobile patient strip */}
        <div className="shrink-0 border-b border-border-subtle bg-card lg:hidden">
          <div className="space-y-2 p-3">
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
                placeholder="Search by name or record ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        {/* Desktop patient list */}
        <div className="hidden w-sidebar shrink-0 flex-col border-r border-border-subtle/70 bg-card/90 lg:flex">
          <div className="space-y-2 p-4">
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle/60 bg-card/60 px-4 py-2">
            <p className="truncate text-xs text-muted">
              {patient ? (
                <>
                  Focusing <span className="font-medium text-foreground">{patient.name}</span>
                </>
              ) : (
                "Select a patient"
              )}
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <AskAkshDrawer
                patientId={selectedPatientId ?? patient?.id ?? null}
                patientLabel={patient?.name}
                triggerTestId="gp-ask-aksh-trigger"
                drawerTestId="gp-ask-aksh-drawer"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1.5 rounded-full text-xs"
                data-testid="gp-agents-drawer-trigger"
                onClick={() => setAgentsOpen(true)}
              >
                <Bot className="h-3.5 w-3.5" />
                Agents
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto bg-transparent p-4 sm:p-6">
            {/* Dismissible once — also under TopBar Demo menu */}
            <GpHeroDemoPath />

            {patient && (
              <header className="dashboard-card p-5 sm:p-6">
                {clinicalLoading ? (
                  <HeaderSkeleton />
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        {patient.name}
                      </h1>
                      <p className="text-xs text-muted">
                        ID {patient.nhsNumber} · DOB {patient.dob} · Age {patient.age}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {displayConditions.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-muted">
                        {(oracleData?.medications ?? patient.activeMedications).length} medications ·
                        Last seen: {patient.lastEncounterDate}
                        {patient.nextAppointmentDate && ` · Next: ${patient.nextAppointmentDate}`}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[#8a5a00]">
                        14-day admission risk:{" "}
                        {oracleData?.admissionRisk14Days ??
                          patient.digitalTwinPrediction.admissionRisk14Days}
                        %.{" "}
                        {
                          (oracleData?.riskFactors ??
                            patient.digitalTwinPrediction.deteriorationSignals)[0]
                        }
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
                            <span className="text-muted">Recorded {vitals.recordedAt}</span>
                          </div>
                        );
                      })()}
                    </div>
                    <RiskScoreBadge score={oracleScore} risk={oracleRisk} size="lg" />
                  </div>
                )}
              </header>
            )}

            {patient ? (
              <ClinicalIntelligenceWorkspace patientId={patient.id} patientLabel={patient.name} />
            ) : null}

            <ReviewQueue
              patientId={selectedPatientId}
              queueLabel={profile?.fullName ? `${profile.fullName}'s queue` : undefined}
            />

            <section>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold"
                onClick={() => setShowWritten(!showWritten)}
              >
                <Check className="h-4 w-4 text-accent" /> Written to Record (
                {writtenToRecordToday.length})
                {showWritten ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                )}
              </button>
              {showWritten && writtenToRecordToday.length > 0 && (
                <div className="mt-2 space-y-2">
                  {writtenToRecordToday.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-accent/25 bg-accent/5 p-4 text-xs shadow-sm"
                    >
                      <p className="font-medium text-accent">✓ {item.title}</p>
                      <p className="text-muted">
                        {item.acceptedBy} ·{" "}
                        {item.acceptedAt && new Date(item.acceptedAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <SimulatedEhrWrittenPanel patientId={selectedPatientId ?? patient?.id ?? null} />
            </section>

            <section>
              <button
                type="button"
                className="mb-2 flex w-full items-center justify-between text-left text-sm font-semibold"
                onClick={() => setShowSecondary((v) => !v)}
                aria-expanded={showSecondary}
              >
                <span>Pathways & risk state</span>
                {showSecondary ? (
                  <ChevronUp className="h-4 w-4 text-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted" />
                )}
              </button>
              {showSecondary ? (
                <div className="space-y-4">
                  <CarePathwayTracker pathways={pathways} />
                  <DigitalTwinPanel patient={patient ?? null} />
                </div>
              ) : null}
            </section>

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
        </div>
      </div>

      <Sheet open={agentsOpen} onOpenChange={setAgentsOpen}>
        <SheetContent
          side="right"
          className="w-full max-w-md overflow-y-auto p-0 sm:max-w-md"
          data-testid="gp-agents-drawer"
        >
          <AgentControlPanel
            patient={patient ?? null}
            oracleData={oracleData}
            guardianData={guardianData}
            oracleLoading={oracleLoading}
            guardianLoading={guardianLoading}
            className="w-full border-0 lg:w-full"
          />
        </SheetContent>
      </Sheet>
    </DashboardShell>
  );
}
