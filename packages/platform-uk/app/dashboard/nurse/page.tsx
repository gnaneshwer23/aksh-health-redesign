"use client";

import Link from "next/link";

import { GuardianAlertsPanel } from "@/components/dashboard/nurse/GuardianAlertsPanel";
import { NursePatientHeader } from "@/components/dashboard/nurse/NursePatientHeader";
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
      <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Nurse actions can append to the durable SHIELD audit when signed in. Observations and handovers still require
        HITL confirmation and do not write to EMIS/SystmOne from this proof build.
      </p>
      <NursePatientHeader />

      <Card className="border-secondary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-secondary">Patient overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Last observations: {patient.lastObsTime ?? "Not recorded"} · Open AI items: {patient.openAiItems}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-secondary hover:bg-secondary/90">
              <Link href="/dashboard/nurse/observations">Record observations</Link>
            </Button>
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
