import type { ClinicalAgentId } from "@/lib/types";
import { agentBadgeClass, CLINICAL_AGENT_META } from "@/lib/agents";

export function AgentBadge({
  agentId,
  compact = false
}: {
  agentId: ClinicalAgentId;
  compact?: boolean;
}) {
  const meta = CLINICAL_AGENT_META[agentId];

  return (
    <span className={`agent-badge ${agentBadgeClass(agentId)}`} title={meta.description}>
      {compact ? agentId : meta.label}
    </span>
  );
}

export function QueueStatusBadge({ status }: { status: "DRAFT" | "ACCEPTED" | "REJECTED" }) {
  const className =
    status === "ACCEPTED" ? "queue-status--accepted" : status === "REJECTED" ? "queue-status--rejected" : "queue-status--draft";

  return <span className={`queue-status-badge ${className}`}>{status}</span>;
}
