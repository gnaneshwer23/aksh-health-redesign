import { Activity, FileText, Scale, Send, Shield, Stethoscope, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { CLINICAL_AGENT_META } from "@/lib/agents";

const agentIcons: Record<string, LucideIcon> = {
  VOICE: Activity,
  SYNTHESIS: FileText,
  DrASSIST: Stethoscope,
  GUARDIAN: Shield,
  ORACLE: TrendingUp,
  REFERRAL: Send,
  EQUITY: Scale,
  SHIELD: Shield,
};

const agentOrder = ["VOICE", "SYNTHESIS", "DrASSIST", "GUARDIAN", "ORACLE", "REFERRAL", "EQUITY", "SHIELD"] as const;

export default function AgentGrid() {
  const agents = agentOrder.map((id) => {
    const meta = CLINICAL_AGENT_META[id];
    return {
      id,
      name: meta.label,
      function: meta.function,
      desc: meta.description,
      icon: agentIcons[id] ?? FileText,
    };
  });

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl md:mb-14">
          <p className="owkin-roles__eyebrow mb-3">Clinical capabilities</p>
          <h2 className="mb-4 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-navy-dark md:text-4xl">
            Eight capabilities. One review queue.
          </h2>
          <p className="text-base leading-relaxed text-slate/75 md:text-lg">
            Each capability drafts or checks work against clinical context. Nothing reaches the record without clinician
            approval — with a full audit trail.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className="rounded-2xl border border-navy/[0.08] bg-white/70 p-5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ebe4d8]">
                  <Icon className="h-4 w-4 text-navy-dark" aria-hidden />
                </div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/55">{agent.function}</p>
                <h3 className="mb-2 font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-navy-dark">
                  {agent.name}
                </h3>
                <p className="text-sm leading-relaxed text-slate/70">{agent.desc}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate/75">
          Human-in-the-loop always.{" "}
          <Link href="/platform#hitl" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Accept, Edit, or Reject
          </Link>{" "}
          before any FHIR write. DCB0129 clinical safety case in progress — not a certification claim.
        </p>
      </div>
    </section>
  );
}
