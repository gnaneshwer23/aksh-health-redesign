"use client";

import { ContinuousCareWorklist } from "@/components/dashboard/diabetes-intelligence/ContinuousCareWorklist";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function GpContinuousCareWorklistPage() {
  return (
    <DashboardShell role="gp" title="Continuous care worklist">
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <ContinuousCareWorklist
          endpoint="/api/gp/continuous-care/worklist"
          title="Continuous care worklist"
          roleLabel="GP / ops"
        />
      </div>
    </DashboardShell>
  );
}
