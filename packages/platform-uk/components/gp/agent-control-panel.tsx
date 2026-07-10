"use client";

import type { AgentCard } from "@/lib/agents";
import { AgentBadge } from "@/components/review/agent-badge";

function statusTone(status: AgentCard["status"]) {
  if (status === "alert") return "danger";
  if (status === "draft_pending" || status === "active") return "warn";
  if (status === "completed") return "ok";
  return "ok";
}

export function GpAgentControlPanel({
  cards,
  activeFilter,
  onFilterChange
}: {
  cards: AgentCard[];
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}) {
  return (
    <section className="panel stack gp-panel">
      <div className="gp-panel__header">
        <p className="gp-panel__eyebrow">Column C · Agent control</p>
        <h2>Clinical AI agents</h2>
        <p className="meta">Synthetic proof mode — mapped to existing workflow modules, not LangGraph.</p>
      </div>

      <div className="gp-agent-grid">
        {cards.map((card) => (
          <button
            className={`gp-agent-card${activeFilter === card.queueFilter ? " is-active" : ""}`}
            key={card.id}
            onClick={() => onFilterChange(activeFilter === card.queueFilter ? null : card.queueFilter ?? null)}
            type="button"
          >
            <div className="gp-agent-card__top">
              <AgentBadge agentId={card.id} />
              <span className={`tag ${statusTone(card.status)}`}>{card.status.replaceAll("_", " ")}</span>
            </div>
            <strong>{card.function}</strong>
            <p>{card.detail}</p>
          </button>
        ))}
      </div>

      <div className="gp-proof-banner">
        <strong>Proof mode</strong>
        <p>No live EMIS, Mirth, or Medplum write-back. All agent outputs remain draft until GP Accept / Edit / Reject.</p>
      </div>
    </section>
  );
}
