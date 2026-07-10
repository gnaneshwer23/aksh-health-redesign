import { AGENT_COLORS } from "@/lib/mock-data";
import type { AgentType } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

export function AgentBadge({ agent, className }: { agent: AgentType | string; className?: string }) {
  const color = AGENT_COLORS[agent] ?? "#4A5568";
  return (
    <span
      className={cn("inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white", className)}
      style={{ backgroundColor: color }}
    >
      {agent}
    </span>
  );
}
