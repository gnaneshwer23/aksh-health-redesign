"use client";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { metricSparklines } from "@/lib/mock-data";

import { useIcsData } from "./IcsDataContext";

export function IcsKpiRow() {
  const { data } = useIcsData();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Total Patients"
        value={data.totalPatients.toLocaleString()}
        sparkline={metricSparklines.patients}
        trend="up"
      />
      <MetricCard
        label="AI Actions This Month"
        value={data.aiActionsThisMonth.toLocaleString()}
        sparkline={metricSparklines.aiActions}
        trend="up"
      />
      <MetricCard
        label="SYNTHESIS Approval Rate"
        value={`${(data.synthesisApprovalRate * 100).toFixed(1)}%`}
        sparkline={metricSparklines.approvalRate.map((v) => v * 100)}
        trend="up"
      />
      <MetricCard
        label="Guardian Alerts"
        value={String(data.guardianAlertsGenerated)}
        sparkline={metricSparklines.guardianAlerts}
      />
    </div>
  );
}
