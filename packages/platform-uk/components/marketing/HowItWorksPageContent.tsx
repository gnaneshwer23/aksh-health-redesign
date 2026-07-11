"use client";

import { useState } from "react";
import { Brain, ClipboardCheck, Link2, ShieldCheck, Sparkles, Stethoscope, Users } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";
import { cn } from "@/lib/utils";

const platformStages: Array<{
  num: string;
  variant: PastelVariant;
  icon: typeof Link2;
  label: string;
  title: string;
  body: string;
}> = [
  {
    num: "01",
    variant: "blue",
    icon: Link2,
    label: "Connect",
    title: "One platform. Every system.",
    body: "Designed to integrate with EMIS Web and SystmOne via FHIR R4 and HL7 v2. No migration project and no rip-and-replace. Your existing EHR stays in place.",
  },
  {
    num: "02",
    variant: "mint",
    icon: Brain,
    label: "Understand",
    title: "A knowledge graph that reasons.",
    body: "Each patient record becomes a connected model in Neo4j: conditions linked to risks, medications to interactions, history to predictions. Twelve specialist agents run in parallel to surface insights.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: ShieldCheck,
    label: "Act",
    title: "Twelve AI agents. One review queue.",
    body: "SYNTHESIS writes your SOAP note. DrASSIST codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a draft in your review queue. Nothing writes to the FHIR record until you click Accept.",
  },
  {
    num: "04",
    variant: "peach",
    icon: Sparkles,
    label: "Learn",
    title: "Every outcome improves the system.",
    body: "Approved decisions feed back into the knowledge graph. Rejected outputs inform model refinement. The platform improves with every consultation across practices in your ICS.",
  },
];

const roleFlows = {
  clinician: {
    label: "Clinician",
    icon: Stethoscope,
    steps: [
      "Consultation data flows in from EMIS Web or SystmOne.",
      "Agents draft SOAP notes, safety checks, and risk scores in parallel.",
      "You review, edit, or reject each draft in one queue.",
      "Accepted outputs stage as FHIR R4 resources, then write to the record.",
    ],
  },
  "practice-manager": {
    label: "Practice manager",
    icon: Users,
    steps: [
      "Practice systems connect through governed FHIR intake paths.",
      "Team activity and agent outputs surface in role dashboards.",
      "Clinical leads approve drafts before any record impact.",
      "Audit trails and SHIELD logs support governance and compliance review.",
    ],
  },
} as const;

type RoleKey = keyof typeof roleFlows;

export function HowItWorksPageContent() {
  const [activeRole, setActiveRole] = useState<RoleKey>("clinician");
  const role = roleFlows[activeRole];
  const RoleIcon = role.icon;

  return (
    <>
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MarketingSectionHeader
            align="left"
            label="End-to-end flow"
            title="Seven stages from intake to record"
            description="A single pipeline connects your EHR, knowledge graph, specialist agents, and clinician review. No autonomous write-back."
            className="mb-10"
          />

          <div className="marketing-pastel-card rounded-3xl border border-white/60 bg-gradient-to-br from-navy-light/40 via-white to-pastel-mint/30 p-6 md:p-10">
            <PlatformFlowDiagram variant="full" />
          </div>
        </div>
      </section>

      <section className="bg-surface-muted py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MarketingSectionHeader
            align="center"
            label="Platform stages"
            title="Connect, understand, act, and learn"
            className="mb-10 md:mb-12"
          />

          <div className="grid gap-6 md:grid-cols-2">
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <MarketingSectionHeader
            align="center"
            label="By role"
            title="How it works for your team"
            description="The same platform pipeline, viewed from different responsibilities."
            className="mb-8"
          />

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {(Object.keys(roleFlows) as RoleKey[]).map((key) => {
              const flow = roleFlows[key];
              const Icon = flow.icon;
              const isActive = activeRole === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveRole(key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2",
                    isActive
                      ? "border-emerald bg-emerald text-white shadow-md"
                      : "border-navy/15 bg-white text-navy hover:border-navy/30"
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {flow.label}
                </button>
              );
            })}
          </div>

          <div className="marketing-pastel-card mx-auto max-w-2xl rounded-2xl border border-white/60 bg-pastel-blue p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                <RoleIcon className="h-5 w-5 text-pastel-blue-ink" aria-hidden />
              </div>
              <p className="text-lg font-bold text-navy">{role.label} workflow</p>
            </div>
            <ol className="list-none space-y-4 p-0">
              {role.steps.map((step, index) => (
                <li key={step} className="flex gap-4 text-sm leading-relaxed text-steel">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-navy">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald/20 bg-emerald/5 p-8 text-center md:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <ClipboardCheck className="h-7 w-7 text-emerald" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-navy md:text-3xl">Human-in-the-loop on every output</h2>
            <p className="mx-auto mt-4 max-w-2xl text-steel">
              Every AI draft is staged for review. Clinicians choose Accept, Edit, or Reject. Only approved content
              progresses to FHIR staging and EHR write-back.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
