"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  Mic,
  Pencil,
  Stethoscope,
  Users,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { EndToEndPipelineDiagram } from "@/components/marketing/EndToEndPipelineDiagram";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { container } from "@/components/marketing/marketing-ui";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";
import { TWO_MINUTE_MARKETING_SCRIPT } from "@/lib/marketing/agent-job-in-loop";
import { cn } from "@/lib/utils";

const platformStages: Array<{
  num: string;
  variant: PastelVariant;
  icon: LucideIcon;
  label: string;
  title: string;
  body: string;
}> = [
  {
    num: "01",
    variant: "blue",
    icon: Mic,
    label: "Capture",
    title: "Capture once",
    body: "Capture consultation context once. Structured for clinician review beside your existing EHR.",
  },
  {
    num: "02",
    variant: "mint",
    icon: ClipboardList,
    label: "Draft",
    title: "Draft + checks",
    body: "Documentation, safety, risk, referrals, and clinical correlation run as supporting drafts. Nothing auto-writes to the record.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: UserCheck,
    label: "Approve",
    title: "Clinician approves",
    body: "Accept, edit, or reject every output. Audit records the decision. Only approved content proceeds for exchange with existing clinical systems.",
  },
];

type RoleStep = {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
};

const roleFlows = {
  clinician: {
    label: "Clinician",
    icon: Stethoscope,
    steps: [
      {
        icon: Mic,
        label: "Capture",
        title: "Consult comes in",
        description:
          "Notes or voice into shared intake. Structured context for drafts — clinician review before the record.",
      },
      {
        icon: ClipboardList,
        label: "Draft",
        title: "Drafts and checks stage",
        description: "Documentation, safety, risk, and referrals land in one review queue.",
      },
      {
        icon: ClipboardCheck,
        label: "Approve",
        title: "You decide",
        description: "Accept, edit, or reject. Audit records the decision; only approved drafts proceed.",
      },
    ] satisfies RoleStep[],
  },
  "practice-manager": {
    label: "Practice manager",
    icon: Users,
    steps: [
      {
        icon: Users,
        label: "Set up",
        title: "Team and org ready",
        description: "Link practice context and role access without replacing the EHR.",
      },
      {
        icon: ClipboardCheck,
        label: "Oversee",
        title: "Queue health visible",
        description: "See backlog and integration status without bypassing clinical sign-off (HITL stays clinician-owned).",
      },
      {
        icon: FileCheck2,
        label: "Evidence",
        title: "Audit for assurance",
        description: "Audit trails support regional governance and internal review.",
      },
    ] satisfies RoleStep[],
  },
} as const;

type RoleKey = keyof typeof roleFlows;

const hitlActions = [
  {
    icon: CheckCircle2,
    label: "Accept",
    description: "Approve the draft as-is. It stages for the record path.",
    tone: "border-emerald/30 bg-emerald/10 text-emerald",
    iconTone: "text-emerald",
  },
  {
    icon: Pencil,
    label: "Edit",
    description: "Refine inline, then approve your version. Your judgement leads.",
    tone: "border-navy/15 bg-white text-navy",
    iconTone: "text-navy",
  },
  {
    icon: XCircle,
    label: "Reject",
    description: "Decline with a reason. Nothing reaches the record.",
    tone: "border-danger/20 bg-danger/5 text-danger",
    iconTone: "text-danger",
  },
] as const;

const headlineCapabilities = [
  { name: "Risk Signals", note: "clinical risk drafts" },
  { name: "Referral Support", note: "referrals · coordination" },
  { name: "Population Insights", note: "population · equity" },
  { name: "Clinical Correlation", note: "clinical impression" },
  { name: "Clinical Capture", note: "intake" },
  { name: "FHIR Exchange", note: "system exchange" },
  { name: "Review Coordination", note: "clinician review gate" },
  { name: "Audit", note: "immutable record" },
] as const;

export function HowItWorksPageContent() {
  const [activeRole, setActiveRole] = useState<RoleKey>("clinician");
  const role = roleFlows[activeRole];

  return (
    <>
      <section id="two-minute-script" className="scroll-mt-24 border-b border-navy/[0.06] bg-white py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Demo host script"
            title="Explain it in two minutes"
            description="Home → workflow → platform → demonstration. No dashboard required."
          />
          <ol className="grid gap-4 md:grid-cols-2">
            {TWO_MINUTE_MARKETING_SCRIPT.map((step) => (
              <li
                key={step.beat}
                className="flex flex-col rounded-2xl border border-navy/[0.08] bg-surface-muted/50 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-emerald">{step.beat}</p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate/80">{step.say}</p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-dark underline-offset-4 hover:underline"
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pipeline" className="scroll-mt-24 bg-white py-12 md:py-16">
        <div className={container}>
          <EndToEndPipelineDiagram />
        </div>
      </section>

      <section id="agents-in-loop" className="scroll-mt-24 bg-surface-muted py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Who does what"
            title="Supporting intelligence in the loop"
            description="Capabilities that support capture, draft, and approve. Full detail on the platform page."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {headlineCapabilities.map((agent) => (
              <div key={agent.name} className="rounded-xl border border-navy/[0.08] bg-white/80 px-4 py-3">
                <p className="font-[family-name:var(--font-marketing-display)] text-base font-semibold text-navy-dark">
                  {agent.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate/70">{agent.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate/70">
            <Link href="/platform#agents" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              View clinical capabilities
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="journey" className="scroll-mt-24 py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Care journey"
            title="Capture, draft, approve"
            description="A calm three-step clinician path. Drafts never auto-write to the record."
          />

          <PlatformFlowDiagram variant="full" />
        </div>
      </section>

      <section className="bg-surface-muted py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="center"
            label="Three steps"
            title="Capture, draft, approve"
            description="One idea per step. One clinician gate before the record."
          />

          <div className="grid gap-6 md:grid-cols-3">
            {platformStages.map((stage) => (
              <PastelCapabilityCard
                key={stage.num}
                variant={stage.variant}
                icon={stage.icon}
                stepNumber={stage.num}
                label={stage.label}
                title={stage.title}
                description={stage.body}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className={container}>
          <div className="overflow-hidden rounded-2xl border-2 border-emerald/25 bg-gradient-to-br from-emerald/5 via-white to-emerald/[0.03]">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
              <div className="border-b border-emerald/15 p-8 md:p-10 lg:border-b-0 lg:border-r">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
                  <ClipboardCheck className="h-7 w-7 text-emerald" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
                  Clinician approval on every output
                </h2>
                <p className="mt-4 text-base leading-relaxed text-steel">
                  Every draft is staged for review. Clinicians choose Accept, Edit, or Reject. Only approved content
                  progresses for exchange with existing clinical systems.
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
                {hitlActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.label}
                      className={cn("marketing-pastel-card flex flex-col rounded-2xl border p-5", action.tone)}
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/80">
                        <Icon className={cn("h-5 w-5", action.iconTone)} aria-hidden />
                      </div>
                      <p className="text-sm font-bold">{action.label}</p>
                      <p className="mt-2 text-xs leading-relaxed opacity-80">{action.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-muted py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="center"
            label="By role"
            title="How it works for your team"
            description="Same care journey, different responsibilities."
          />

          <div className="mb-8 flex justify-center">
            <div
              className="inline-flex rounded-full border border-navy/10 bg-white p-1 shadow-sm"
              role="tablist"
              aria-label="Select role journey"
            >
              {(Object.keys(roleFlows) as RoleKey[]).map((key) => {
                const flow = roleFlows[key];
                const Icon = flow.icon;
                const isActive = activeRole === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`role-tab-${key}`}
                    aria-selected={isActive}
                    aria-controls={`role-panel-${key}`}
                    onClick={() => setActiveRole(key)}
                    className={cn(
                      "inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2",
                      isActive ? "bg-navy text-white shadow-md" : "text-navy hover:bg-navy/[0.04]"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {flow.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id={`role-panel-${activeRole}`}
            role="tabpanel"
            aria-labelledby={`role-tab-${activeRole}`}
            className="grid gap-6 sm:grid-cols-3"
          >
            {role.steps.map((step, index) => (
              <PastelCapabilityCard
                key={step.title}
                variant={pastelVariantAt(index)}
                icon={step.icon}
                stepNumber={String(index + 1).padStart(2, "0")}
                label={step.label}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Architecture"
            title="Data flow from clinical systems to governed record"
            description="How clinical systems connect to Aksh Health, pass clinician review, and exchange using FHIR standards."
          />

          <PlatformFlowDiagram variant="architecture" />
        </div>
      </section>
    </>
  );
}
