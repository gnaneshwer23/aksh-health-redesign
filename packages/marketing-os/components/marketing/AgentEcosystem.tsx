import { AgentCard } from "@/components/shared/AgentCard";
import { agents } from "@/lib/content";

const groups = [
  {
    key: "patient" as const,
    title: "Patient Agents",
    headerClass: "text-secondary",
  },
  {
    key: "clinical" as const,
    title: "Clinical Agents",
    headerClass: "text-primary",
  },
  {
    key: "operational" as const,
    title: "Operational Agents",
    headerClass: "text-layer-slate",
  },
];

export function AgentEcosystem() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Twelve AI Agents. Every Role. One Platform.
          </h2>
          <p className="mt-4 text-muted">
            Each agent has memory, permissions, an audit trail, and a
            human-approval gate before any action is taken.
          </p>
        </div>
        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <div key={group.key}>
              <h3 className={`mb-6 text-xl font-bold ${group.headerClass}`}>
                {group.title}
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents
                  .filter((agent) => agent.category === group.key)
                  .map((agent) => (
                    <AgentCard key={agent.name} agent={agent} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
