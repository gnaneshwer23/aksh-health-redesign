"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Building2, Users } from "lucide-react";

import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { calcBedOccupancyPct } from "@/components/dashboard/hospital/hospital-utils";
import { CausalHypothesisPanel } from "@/components/dashboard/precision-health/CausalHypothesisPanel";
import { ScenarioRankingPanel } from "@/components/dashboard/precision-health/ScenarioRankingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientById, hospitalData } from "@/lib/mock-data";

const sections = [
  {
    href: "/dashboard/hospital/wards",
    label: "Ward Status",
    description: "Live ward grid with occupancy and discharge backlog",
    icon: Building2,
  },
  {
    href: "/dashboard/hospital/capacity",
    label: "Capacity",
    description: "14-day forecast and AI recommendations with HITL approval",
    icon: BarChart3,
  },
  {
    href: "/dashboard/hospital/staffing",
    label: "Staffing",
    description: "Ward staffing ratios and agency trigger alerts",
    icon: Users,
  },
];

const DEMO_PATIENT_ID = "P001";

export default function HospitalOverviewPage({
  hospitalName = hospitalData.hospitalName,
}: {
  hospitalName?: string;
}) {
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const showRiskState = panel === "digital-twin";
  const bedPct = calcBedOccupancyPct(hospitalData);
  const demoPatient = getPatientById(DEMO_PATIENT_ID);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-primary">
          {showRiskState ? "Risk state + scenario ranking" : "Command Centre Overview"}
        </h2>
        <p className="text-sm text-muted mt-1">
          {showRiskState
            ? "Population / patient risk state and synthetic scenario ranking — not a physiological digital twin"
            : `${hospitalName}: synthetic operational intelligence across ${hospitalData.wards.length} wards (rehearsal — not a live PAS feed)`}
        </p>
      </div>

      {!showRiskState ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted">ED Wait</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-danger">{hospitalData.edWaitingTime}h</p>
              <p className="text-xs text-muted">{hospitalData.edPatientsWaiting} patients waiting</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted">Bed Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{bedPct}%</p>
              <p className="text-xs text-muted">Across all wards at {hospitalName}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted">Theatres</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">
                {hospitalData.theatresRunning}/{hospitalData.theatresTotal}
              </p>
              <p className="text-xs text-muted">Running now</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted">Agency Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-danger">{hospitalData.agencyTriggers.length}</p>
              <p className="text-xs text-muted">Pending staffing triggers</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {showRiskState && demoPatient ? (
        <DigitalTwinPanel patient={demoPatient} readOnly />
      ) : null}

      <ScenarioRankingPanel
        patientId={DEMO_PATIENT_ID}
        patientLabel="Synthetic HF demo patient (hospital rehearsal)"
      />

      {showRiskState ? (
        <CausalHypothesisPanel
          patientId={DEMO_PATIENT_ID}
          patientLabel="Synthetic HF demo patient (hospital rehearsal)"
        />
      ) : null}

      {!showRiskState ? (
        <section>
          <h3 className="text-sm font-semibold mb-3">Sections</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href} className="group">
                  <Card className="shadow-sm h-full transition-colors group-hover:border-primary/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm">{section.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted">{section.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="text-xs text-muted">
          <Link href="/dashboard/hospital" className="text-primary underline-offset-2 hover:underline">
            ← Back to Command Centre overview
          </Link>
        </p>
      )}
    </div>
  );
}
