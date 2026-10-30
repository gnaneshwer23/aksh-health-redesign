"use client";

import { AgentIntelligenceWorklist } from "@/components/dashboard/diabetes-intelligence/AgentIntelligenceWorklist";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UnifiedGpReviewBanner } from "@/components/dashboard/UnifiedGpReviewBanner";

export default function GpAgentIntelligenceWorklistPage() {
  return (
    <DashboardShell role="gp" title="Agent intelligence worklist (prep)">
      <div className="overflow-y-auto p-4 space-y-4" style={{ background: "#f7fafc" }}>
        <UnifiedGpReviewBanner />
        <AgentIntelligenceWorklist
          endpoint="/api/gp/agent-intelligence/worklist"
          title="Domain prep — diabetes agent intelligence"
        />
      </div>
    </DashboardShell>
  );
}
