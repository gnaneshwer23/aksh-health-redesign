"use client";

import { useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Link2,
  Pencil,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
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
    body: "SYNTHESIS writes your SOAP note. Dr.Assist codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a draft in your review queue. Nothing writes to the FHIR record until you click Accept.",
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
        icon: ArrowRightLeft,
        label: "Intake",
        title: "Data flows from your EHR",
        description: "Consultation data arrives from EMIS Web or SystmOne through governed FHIR intake paths.",
      },
      {
        icon: Brain,
        label: "Context",
        title: "Knowledge graph loads",
        description: "Patient history, medications, and risks connect in Neo4j to give agents full clinical context.",
      },
      {
        icon: Sparkles,
        label: "Draft",
        title: "Agents work in parallel",
        description: "Twelve specialists draft SOAP notes, safety checks, coding suggestions, and risk scores at once.",
      },
      {
        icon: ClipboardCheck,
        label: "Queue",
        title: "One unified review queue",
        description: "Every draft appears in a single clinician queue. Nothing is hidden across separate tools or tabs.",
      },
      {
        icon: Pencil,
        label: "Review",
        title: "Accept, Edit, or Reject",
        description: "You stay in control of every output. Edit drafts inline before approving, or reject with a reason.",
      },
      {
        icon: CheckCircle2,
        label: "Record",
        title: "FHIR write on approval",
        description: "Accepted outputs stage as FHIR R4 resources, then write back to the EHR record.",
      },
    ] satisfies RoleStep[],
  },
  "practice-manager": {
    label: "Practice manager",
    icon: Users,
    steps: [
      {
        icon: Link2,
        label: "Connect",
        title: "Systems onboard cleanly",
        description: "Practice systems connect through governed FHIR intake. No rip-and-replace of existing EHR workflows.",
      },
      {
        icon: BarChart3,
        label: "Visibility",
        title: "Team dashboards",
        description: "Agent activity, review queues, and workflow status surface in role-specific dashboards for your team.",
      },
      {
        icon: ClipboardCheck,
        label: "Governance",
        title: "Clinical leads approve",
        description: "Drafts queue for clinical lead review before any record impact. You set who approves what.",
      },
      {
        icon: FileSearch,
        label: "Audit",
        title: "Full audit trails",
        description: "SHIELD logs capture every agent action, review decision, and write-back event for compliance review.",
      },
      {
        icon: ShieldCheck,
        label: "Compliance",
        title: "Governance reporting",
        description: "Exportable audit trails and activity reports support ICS governance and regulatory requirements.",
      },
    ] satisfies RoleStep[],
  },
} as const;

type RoleKey = keyof typeof roleFlows;

const hitlActions = [
  {
    icon: CheckCircle2,
    label: "Accept",
    description: "Approve the draft as-is. It stages as FHIR R4 and writes to the record.",
    tone: "border-emerald/30 bg-emerald/10 text-emerald",
    iconTone: "text-emerald",
  },
  {
    icon: Pencil,
    label: "Edit",
    description: "Refine the draft inline, then approve your version. Your clinical judgement leads.",
    tone: "border-navy/15 bg-white text-navy",
    iconTone: "text-navy",
  },
  {
    icon: XCircle,
    label: "Reject",
    description: "Decline the output with a reason. Nothing reaches the record. Feedback improves the system.",
    tone: "border-danger/20 bg-danger/5 text-danger",
    iconTone: "text-danger",
  },
] as const;

export function HowItWorksPageContent() {
  const [activeRole, setActiveRole] = useState<RoleKey>("clinician");
  const role = roleFlows[activeRole];

  const gridCols =
    role.steps.length <= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : role.steps.length === 5
        ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      {/* Main pipeline diagram */}
      <section className="bg-white py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="End-to-end flow"
            title="Seven stages from intake to record"
            description="A single pipeline connects your EHR, knowledge graph, specialist agents, and clinician review. No autonomous write-back."
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-pastel-blue/40 via-white to-pastel-mint/30 p-8 md:p-12 lg:p-14">
            <div
              className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-16 -top-16 h-48 w-48 opacity-20"
              aria-hidden
            />
            <div
              className="marketing-hero-blob marketing-hero-blob--navy absolute -bottom-20 -left-20 h-56 w-56 opacity-10"
              aria-hidden
            />
            <div className="relative">
              <PlatformFlowDiagram variant="full" />
            </div>
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="center"
            label="Platform pillars"
            title="Connect, understand, act, and learn"
            description="Four capabilities that turn fragmented clinical data into coordinated, governed care."
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* HITL callout */}
      <section className="bg-white py-20 md:py-24">
        <div className={container}>
          <div className="overflow-hidden rounded-2xl border-2 border-emerald/25 bg-gradient-to-br from-emerald/5 via-white to-emerald/[0.03]">
            <div className="grid gap-0 lg:grid-cols-[1fr_1.4fr]">
              <div className="border-b border-emerald/15 p-8 md:p-10 lg:border-b-0 lg:border-r">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald/10">
                  <ClipboardCheck className="h-7 w-7 text-emerald" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-navy md:text-3xl">
                  Human-in-the-loop on every output
                </h2>
                <p className="mt-4 text-base leading-relaxed text-steel">
                  Every AI draft is staged for review. Clinicians choose Accept, Edit, or Reject. Only approved content
                  progresses to FHIR staging and EHR write-back.
                </p>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-3 md:p-8">
                {hitlActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.label}
                      className={cn(
                        "marketing-pastel-card flex flex-col rounded-2xl border p-5",
                        action.tone
                      )}
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

      {/* Role journeys */}
      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="center"
            label="By role"
            title="How it works for your team"
            description="The same platform pipeline, viewed from different responsibilities."
          />

          <div className="mb-10 flex justify-center">
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
                      isActive
                        ? "bg-navy text-white shadow-md"
                        : "text-navy hover:bg-navy/[0.04]"
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
            className={cn("grid gap-6", gridCols)}
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

      {/* Architecture layer */}
      <section className="bg-white py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Architecture"
            title="Data flow from EHR to governed record"
            description="A compact view of how clinical systems connect to Aksh, pass through clinician review, and write back as FHIR R4."
          />

          <div className="marketing-pastel-card rounded-2xl border border-white/60 bg-gradient-to-br from-navy-light/30 via-white to-pastel-lavender/20 p-8 md:p-12">
            <PlatformFlowDiagram variant="architecture" />
          </div>
        </div>
      </section>
    </>
  );
}
