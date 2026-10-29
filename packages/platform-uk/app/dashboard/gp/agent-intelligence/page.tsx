"use client";

import { AgentIntelligenceWorklist } from "@/components/dashboard/diabetes-intelligence/AgentIntelligenceWorklist";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function GpAgentIntelligenceWorklistPage() {
  return (
    <DashboardShell role="gp" title="Agent intelligence worklist">
      <div className="overflow-y-auto p-4" style={{ background: "#f7fafc" }}>
        <AgentIntelligenceWorklist
          endpoint="/api/gp/agent-intelligence/worklist"
          title="Agent intelligence worklist"
        />
      </div>
    </DashboardShell>
  );
}
