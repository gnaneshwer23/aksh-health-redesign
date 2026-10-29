"use client";

import { ContinuousCareWorklist } from "@/components/dashboard/diabetes-intelligence/ContinuousCareWorklist";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function NurseContinuousCareQueuePage() {
  return (
    <DashboardShell role="nurse" title="Continuous care queue">
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <ContinuousCareWorklist
          endpoint="/api/nurse/continuous-care/worklist"
          title="Nurse continuous care queue"
          roleLabel="nurse / ops"
        />
      </div>
    </DashboardShell>
  );
}
