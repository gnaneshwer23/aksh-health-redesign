"use client";

import Link from "next/link";

import { RoleWorkspaceIntro } from "@/components/dashboard/RoleWorkspaceIntro";
import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NurseHeroDemoPath } from "@/components/dashboard/nurse/NurseHeroDemoPath";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
import { ObservationWorklist } from "@/components/dashboard/nurse/ObservationWorklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export default function NurseOverviewPage() {
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];
  const openAlerts = patient.flags.includes("GUARDIAN") || patient.flags.includes("URGENT");

  return (
    <div className="space-y-4">
      <NurseHeroDemoPath />
      <p
        className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-xs text-muted"
        data-testid="nurse-honesty-banner"
      >
        Nurse HITL · synthetic panel · liveEmis:false · ehrWrite:false. Observations append to the
        clinical spine / SHIELD when signed in — not EMIS/SystmOne from this proof build.
      </p>
      <RoleWorkspaceIntro
        eyebrow="Nurse workspace"
        title="Diabetes reviews, better coordinated"
        lede="Observations, handovers, and continuous-care follow-ups for the selected patient. Drafts wait for a named clinician."
        actions={
          <>
            <Button asChild className="bg-[#121715] text-white hover:bg-black">
              <Link href="/dashboard/nurse/observations">Record observations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/nurse/continuous-care">Continuous care queue</Link>
            </Button>
          </>
        }
      />
      <NursePatientHeader />
      <ObservationWorklist />

      <Card className="dashboard-card border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-secondary">Patient overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Last observations: {patient.lastObsTime ?? "Not recorded"} · Open AI items:{" "}
            {patient.openAiItems}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/nurse/handover">Shift handover</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/nurse/alerts">
                {openAlerts ? "View GUARDIAN alerts" : "Check alerts"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <GuardianAlertsPanel scope="selected" />
    </div>
  );
}
