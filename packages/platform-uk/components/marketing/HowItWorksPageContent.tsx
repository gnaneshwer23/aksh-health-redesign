"use client";

import { useState } from "react";
import {
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

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { container } from "@/components/marketing/marketing-ui";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";
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
    body: "Consultation notes or voice, with clinical context from EMIS Web or SystmOne. No rip-and-replace of your EHR.",
  },
  {
    num: "02",
    variant: "mint",
    icon: ClipboardList,
    label: "Draft",
    title: "Draft + checks",
    body: "Structured notes, safety flags, and referral packages stage for review. Nothing auto-writes to the record.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: UserCheck,
    label: "Approve",
    title: "Clinician approves",
    body: "Accept, edit, or reject every output. Only then can content stage as FHIR toward EMIS or SystmOne.",
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
        description: "Notes or voice during the appointment. EMR context loads from EMIS or SystmOne.",
      },
      {
        icon: ClipboardList,
        label: "Draft",
        title: "Drafts and checks stage",
        description: "SOAP structure, interaction flags, and referrals land in one review queue.",
      },
      {
        icon: ClipboardCheck,
        label: "Approve",
        title: "You decide",
        description: "Accept, edit, or reject. Only approved content progresses toward the record.",
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
        description: "See backlog and integration status without bypassing clinical sign-off.",
      },
      {
        icon: FileCheck2,
        label: "Evidence",
        title: "Audit for assurance",
        description: "Exportable trails support ICS governance and internal review.",
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

export function HowItWorksPageContent() {
  const [activeRole, setActiveRole] = useState<RoleKey>("clinician");
  const role = roleFlows[activeRole];

  return (
    <>
      <section id="journey" className="scroll-mt-24 py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="End-to-end flow"
            title="From capture to governed record"
            description="A calm pipeline: capture the consult, stage drafts and checks, then clinician approval. No unsupervised write-back."
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-pastel-blue/40 via-white to-pastel-mint/30 p-6 md:p-10 lg:p-12">
            <div className="relative">
              <PlatformFlowDiagram variant="full" />
            </div>
          </div>
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
                  progresses toward FHIR staging and EHR write-back.
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
            title="Data flow from EHR to governed record"
            description="How clinical systems connect to Aksh Health, pass clinician review, and stage as FHIR R4."
          />

          <div className="marketing-pastel-card rounded-2xl border border-white/60 bg-gradient-to-br from-navy-light/30 via-white to-pastel-lavender/20 p-6 md:p-10">
            <PlatformFlowDiagram variant="architecture" />
          </div>
        </div>
      </section>
    </>
  );
}
