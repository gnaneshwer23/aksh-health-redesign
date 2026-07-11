"use client";

import { RiskScoreBadge } from "@/components/dashboard/RiskScoreBadge";
import { patients } from "@/lib/mock-data";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

export function NursePatientHeader() {
  const selectedPatientId = useDashboardStore((s) => s.selectedPatientId);
  const patient = patients.find((p) => p.id === (selectedPatientId ?? "P001")) ?? patients[0];

  return (
    <>
      <header className="rounded-sm border border-border bg-card p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-secondary">{patient.name}</h1>
        <p className="text-xs text-muted">
          DOB {patient.dob} · NHS {patient.nhsNumber} · GP: {patient.supervisingGp}
        </p>
        <RiskScoreBadge score={patient.oracleScore} risk={patient.oracleRisk} className="mt-2" />
      </header>

      {patient.equityFlag ? (
        <div className="rounded-sm border border-emerald/30 bg-emerald-light px-4 py-3 text-sm text-emerald" role="alert">
          Equity flag: consider GP review for care disparity
        </div>
      ) : null}
    </>
  );
}
