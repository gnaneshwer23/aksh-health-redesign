"use client";

import { FlaskConical, Shield, Users, Download } from "lucide-react";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { metricSparklines } from "@/lib/mock-data";

import { useResearcherData } from "./ResearcherDataContext";

const RESEARCHER_ACCENT = "border-l-[#E67E22]";

export function ResearcherKpiRow() {
  const { cohort } = useResearcherData();
  const lastExport = new Date(cohort.lastExportDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        className={RESEARCHER_ACCENT}
        label="Patients in Scope"
        value={cohort.totalPatientsInScope.toLocaleString()}
        sparkline={metricSparklines.patients}
        icon={Users}
      />
      <MetricCard
        className={RESEARCHER_ACCENT}
        label="Anonymised Cohort"
        value={cohort.anonymisedCohortSize.toLocaleString()}
        sparkline={metricSparklines.patients.slice(0, 6)}
        icon={Shield}
      />
      <MetricCard
        className={RESEARCHER_ACCENT}
        label="Studies Active"
        value={String(cohort.studiesActive)}
        sparkline={metricSparklines.aiActions.slice(0, 5)}
        icon={FlaskConical}
      />
      <MetricCard
        className={RESEARCHER_ACCENT}
        label="Last Export"
        value={lastExport}
        icon={Download}
      />
    </div>
  );
}
