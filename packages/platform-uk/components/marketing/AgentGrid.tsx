import {
  Activity,
  FileText,
  GitBranch,
  Network,
  Scale,
  Send,
  Shield,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { AGENT_DIRECTORY } from "@/lib/agents";
import {
  AGENT_JOB_IN_LOOP,
  AGENT_SUB_CAPABILITIES,
  LOOP_STAGE_LABEL,
  type AgentLoopStage,
} from "@/lib/marketing/agent-job-in-loop";

const agentIcons: Record<string, LucideIcon> = {
  CANVAS: Activity,
  SYNTHESIS: FileText,
  BRIDGE: GitBranch,
  NEXUS: Network,
  GUARDIAN: Shield,
  PRISM: Stethoscope,
  HORIZON: TrendingUp,
  PATHWAY: Send,
  COMPASS: Scale,
  ATLAS: Network,
  SHIELD: Shield,
  CONDUCTOR: GitBranch,
};

/** Display order follows the consult loop, then population / roadmap. */
const STAGE_ORDER: AgentLoopStage[] = [
  "capture",
  "draft",
  "orchestrate",
  "approve",
  "stage",
  "population",
  "roadmap",
];

export default function AgentGrid() {
  const agents = AGENT_DIRECTORY.map((agent) => {
    const jobMeta = AGENT_JOB_IN_LOOP[agent.name];
    const renameNote =
      agent.previously === "ORACLE" || agent.previously === "REFERRAL" || agent.previously === "EQUITY"
        ? `Formerly ${agent.previously}. `
        : "";
    return {
      id: agent.name,
      name: agent.name,
      function: agent.role,
      stage: jobMeta?.stage ?? ("draft" as AgentLoopStage),
      job: jobMeta?.job ?? agent.role,
      meta: agent.live
        ? `${agent.category} · Phase ${agent.phase} · live drafts + HITL`
        : `${agent.category} · Phase ${agent.phase} · roadmap — not built`,
      renameNote,
      live: agent.live,
      icon: agentIcons[agent.name] ?? FileText,
    };
  });

  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    label: LOOP_STAGE_LABEL[stage],
    agents: agents.filter((a) => a.stage === stage),
  })).filter((group) => group.agents.length > 0);

  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl md:mb-14">
          <p className="owkin-roles__eyebrow mb-3">Clinical capabilities</p>
          <h2 className="mb-4 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-navy-dark md:text-4xl">
            Twelve agents. One review queue.
          </h2>
          <p className="text-base leading-relaxed text-slate/75 md:text-lg">
            Capture → draft → clinician approve → stage. Phase 1 agents run as live drafts under HITL; PRISM and ATLAS
            stay Phase 2 roadmap (not built). VOICE and Dr.Assist are intake/coding sub-capabilities under CANVAS /
            SYNTHESIS — not a 13th or 14th peer agent. Nothing reaches a live EHR without HITL — and this build keeps
            liveEmis:false.
          </p>
        </div>

        <div className="space-y-10">
          {byStage.map((group) => (
            <div key={group.stage}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-navy/55">
                {group.label}
                {group.stage === "roadmap" ? " · not live" : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.agents.map((agent) => {
                  const Icon = agent.icon;
                  return (
                    <div
                      key={agent.id}
                      className="flex flex-col rounded-2xl border border-navy/[0.08] bg-white/70 p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/[0.08]">
                          <Icon className="h-4 w-4 text-navy-dark" aria-hidden />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-navy/55">
                          {agent.live ? "Live" : "Phase 2"}
                        </span>
                      </div>
                      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-navy/55">{agent.function}</p>
                      <h3 className="mb-2 font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-navy-dark">
                        {agent.name}
                      </h3>
                      <p className="mb-3 flex-1 text-sm leading-relaxed text-slate/80">
                        {agent.renameNote}
                        {agent.job}
                      </p>
                      <p className="text-xs leading-relaxed text-slate/60">{agent.meta}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-navy/[0.08] bg-surface-muted/60 p-6 md:p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-navy/55">Sub-capabilities — not peer agents</p>
          <p className="mb-5 max-w-2xl text-sm leading-relaxed text-slate/75">
            These feed the 12-agent directory. They are never counted as a 13th or 14th Phase-1 agent.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {AGENT_SUB_CAPABILITIES.map((cap) => (
              <div key={cap.name} className="rounded-xl border border-navy/[0.06] bg-white/80 p-4">
                <p className="text-sm font-semibold text-navy-dark">
                  {cap.name}{" "}
                  <span className="font-normal text-slate/60">under {cap.under}</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate/70">{cap.job}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate/75">
          Human-in-the-loop always.{" "}
          <Link href="/how-it-works#pipeline" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            See the end-to-end pipeline
          </Link>
          {" · "}
          <Link href="/platform#hitl" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Accept, Edit, or Reject
          </Link>
          {" · "}
          <Link href="/demo/script" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Guided demo script
          </Link>{" "}
          before any FHIR staging. DCB0129-style safety rehearsal — not a certification claim.
        </p>
      </div>
    </section>
  );
}
