"use client";

import { DiabetesGlucoseWorklist } from "@/components/dashboard/diabetes-intelligence/DiabetesGlucoseWorklist";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DiabetesIntelligenceWorklistPage() {
  return (
    <DashboardShell role="gp" title="Glucose intelligence worklist">
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <DiabetesGlucoseWorklist />
      </div>
    </DashboardShell>
  );
}
