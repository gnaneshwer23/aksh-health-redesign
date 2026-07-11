"use client";

import { PopulationCharts } from "@/components/dashboard/ics/PopulationCharts";

export default function IcsPopulationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Population Health</h2>
        <p className="text-sm text-muted">Risk profile and condition prevalence across deprivation quintiles.</p>
      </div>
      <PopulationCharts />
    </div>
  );
}
