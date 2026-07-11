import { CLINICAL_AGENT_META } from "@/lib/agents";
import { AGENT_COLORS } from "@/lib/mock-data";
import type { AgentType } from "@/lib/mock-data/types";
import type { ClinicalAgentId } from "@/lib/types";
import { cn } from "@/lib/utils";

function resolveAgentLabel(agent: AgentType | string) {
  if (agent in CLINICAL_AGENT_META) {
    return CLINICAL_AGENT_META[agent as ClinicalAgentId].label;
  }
  return agent;
}

export function AgentBadge({ agent, className }: { agent: AgentType | string; className?: string }) {
  const color = AGENT_COLORS[agent] ?? "#4A5568";
  const label = resolveAgentLabel(agent);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wide text-white",
        label === agent ? "uppercase" : "",
        className
      )}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
