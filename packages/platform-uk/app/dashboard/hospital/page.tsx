"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Building2, Heart, Users } from "lucide-react";

import { DigitalTwinPanel } from "@/components/dashboard/DigitalTwinPanel";
import { HospitalCommandMap } from "@/components/dashboard/HospitalCommandMap";
import { calcBedOccupancyPct } from "@/components/dashboard/hospital/hospital-utils";
import { HospitalHeroDemoPath } from "@/components/dashboard/hospital/HospitalHeroDemoPath";
import { WardPatientContext } from "@/components/dashboard/hospital/WardPatientContext";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CausalHypothesisPanel } from "@/components/dashboard/precision-health/CausalHypothesisPanel";
import { ScenarioRankingPanel } from "@/components/dashboard/precision-health/ScenarioRankingPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPatientById, hospitalData } from "@/lib/mock-data";
import type { Ward } from "@/lib/mock-data/types";

const sections = [
  {
    href: "/dashboard/hospital/wards",
    label: "Ward Status",
    description: "Synthetic ward grid with occupancy and discharge backlog",
    icon: Building2,
  },
  {
    href: "/dashboard/hospital/capacity",
    label: "Capacity",
    description: "14-day forecast and AI recommendations with HITL approval (HORIZON)",
    icon: BarChart3,
  },
  {
    href: "/dashboard/hospital/staffing",
    label: "Staffing",
    description: "Ward staffing ratios and agency trigger alerts (PATHWAY framing)",
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
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);

  return (
    <div className="space-y-5 p-4">
      {!showRiskState ? <HospitalHeroDemoPath /> : null}
      <p className="sr-only" data-testid="hospital-honesty-banner">
        Not live PAS · synthetic PAS rehearsal · liveEmis:false. PATHWAY / HORIZON draft operational
        foresight; CONDUCTOR keeps HITL on capacity recommendations — no hospital system write-back.
      </p>

      <div>
        <h2 className="text-lg font-semibold text-primary">
          {showRiskState ? "Risk state + scenario ranking" : "Command Centre Overview"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {showRiskState
            ? "Population / patient risk state and synthetic scenario ranking — not a physiological digital twin"
            : `${hospitalName}: synthetic operational intelligence across ${hospitalData.wards.length} wards (rehearsal — not a live PAS feed)`}
        </p>
      </div>

      {!showRiskState ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="hospital-ops-metrics">
          <MetricCard
            label="ED wait"
            value={`${hospitalData.edWaitingTime}h`}
            tone="danger"
          />
          <MetricCard label="Bed occupancy" value={`${bedPct}%`} tone="warn" />
          <MetricCard
            label="Theatres"
            value={`${hospitalData.theatresRunning}/${hospitalData.theatresTotal}`}
          />
          <MetricCard
            label="Agency alerts"
            value={String(hospitalData.agencyTriggers.length)}
            tone={hospitalData.agencyTriggers.length > 0 ? "danger" : "default"}
          />
        </div>
      ) : null}

      {!showRiskState ? (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">Wards</h3>
            <p className="text-xs text-muted">
              Select a ward for synthetic patient context. Named Ask Aksh stays denied for ops roles.
            </p>
          </div>
          <HospitalCommandMap
            wards={hospitalData.wards}
            selectedWardName={selectedWard?.name ?? null}
            onSelectWard={setSelectedWard}
          />
          {selectedWard ? (
            <WardPatientContext ward={selectedWard} onClear={() => setSelectedWard(null)} />
          ) : null}
        </section>
      ) : null}

      {showRiskState && demoPatient ? (
        <DigitalTwinPanel patient={demoPatient} readOnly />
      ) : null}

      {showRiskState ? (
        <>
          <ScenarioRankingPanel
            patientId={DEMO_PATIENT_ID}
            patientLabel="Synthetic HF demo patient (hospital rehearsal)"
          />
          <CausalHypothesisPanel
            patientId={DEMO_PATIENT_ID}
            patientLabel="Synthetic HF demo patient (hospital rehearsal)"
          />
        </>
      ) : null}

      {!showRiskState ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold">Sections</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link key={section.href} href={section.href} className="group">
                  <Card className="h-full shadow-sm transition-colors group-hover:border-primary/40">
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
            <Link href="/dashboard/hospital?panel=digital-twin" className="group">
              <Card className="h-full border-l-4 border-l-[#006B4F] shadow-sm transition-colors group-hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[#006B4F]" />
                    <CardTitle className="text-sm">Risk state</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted">
                    Patient risk state + scenario ranking — scaffolding, not a physiological twin
                  </p>
                </CardContent>
              </Card>
            </Link>
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
