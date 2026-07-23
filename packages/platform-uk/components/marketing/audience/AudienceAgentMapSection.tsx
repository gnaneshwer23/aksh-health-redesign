import Link from "next/link";

import type { AudienceAgentMap } from "@/lib/marketing/audience-agent-maps";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { container } from "@/components/marketing/marketing-ui";

type AudienceAgentMapSectionProps = {
  agentMap: AudienceAgentMap;
};

export function AudienceAgentMapSection({ agentMap }: AudienceAgentMapSectionProps) {
  return (
    <section
      id="agents-for-you"
      className="scroll-mt-24 border-t border-navy/[0.06] py-12 md:py-16"
      aria-labelledby="audience-agent-map-heading"
    >
      <div className={container}>
        <MarketingSectionHeader
          align="left"
          label={agentMap.sectionLabel}
          title={agentMap.sectionTitle}
          description={agentMap.sectionDescription}
        />

        <div className="mt-8 max-w-3xl rounded-2xl border border-navy/[0.08] bg-surface-muted/60 px-5 py-4 md:px-6 md:py-5">
          <p className="text-xs font-semibold tracking-wide text-navy/55">What you approve</p>
          <p className="mt-2 text-base leading-relaxed text-navy-dark">{agentMap.youApprove}</p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agentMap.agents.map((agent) => (
            <li
              key={agent.name}
              className="rounded-2xl border border-navy/[0.08] bg-white px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]"
            >
              <p className="font-[family-name:var(--font-marketing-display)] text-lg font-semibold tracking-tight text-navy-dark">
                {agent.name}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate/80">{agent.why}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-slate/75">
          {agentMap.honestyNote}{" "}
          <Link href="/platform#agents" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            View clinical capabilities
          </Link>
          {" · "}
          <Link href="/demo/script" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Book demonstration
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
