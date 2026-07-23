import {
  Activity,
  FileText,
  GitBranch,
  Network,
  Scale,
  Send,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Capability = {
  id: string;
  label: string;
  category: string;
  description: string;
  icon: LucideIcon;
};

/** Human-facing capability labels — no internal agent codenames as primary copy. */
const CAPABILITIES: Capability[] = [
  {
    id: "capture",
    label: "Clinical Capture",
    category: "Intake",
    description: "Structures patient history, medications, and encounter context so drafts start from one shared intake.",
    icon: Activity,
  },
  {
    id: "documentation",
    label: "Documentation",
    category: "Draft",
    description: "Turns the consultation into a structured clinical draft for the review queue.",
    icon: FileText,
  },
  {
    id: "safety",
    label: "Safety Review",
    category: "Draft",
    description: "Flags drug interactions and allergy risks so high-severity items surface for clinician attention.",
    icon: Shield,
  },
  {
    id: "risk",
    label: "Risk Signals",
    category: "Draft",
    description: "Surfaces clinical risk signals as drafts until a clinician accepts or edits them.",
    icon: TrendingUp,
  },
  {
    id: "referral",
    label: "Referral Support",
    category: "Draft",
    description: "Packages referrals, pathway enrolment, and follow-up tasks for sign-off.",
    icon: Send,
  },
  {
    id: "coordination",
    label: "Review Coordination",
    category: "Orchestrate",
    description: "Orders supporting checks for the consult type and enforces clinician review before exchange.",
    icon: GitBranch,
  },
  {
    id: "fhir",
    label: "FHIR Exchange",
    category: "Exchange",
    description: "Maps accepted drafts to FHIR standards for integration with existing clinical systems.",
    icon: GitBranch,
  },
  {
    id: "audit",
    label: "Audit",
    category: "Governance",
    description: "Records an immutable audit event on every Accept, Edit, or Reject decision.",
    icon: Shield,
  },
  {
    id: "correlation",
    label: "Clinical Correlation",
    category: "Draft",
    description: "Correlates labs, medications, and related signals into a draft clinical impression.",
    icon: Network,
  },
  {
    id: "population",
    label: "Population Insights",
    category: "Population",
    description: "Aggregates risk and equity signals for ICS views without patient-level spill.",
    icon: Scale,
  },
];

export default function AgentGrid() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 max-w-2xl md:mb-14">
          <p className="owkin-roles__eyebrow mb-3">Clinical capabilities</p>
          <h2 className="mb-4 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-navy-dark md:text-4xl">
            Supporting intelligence. One review queue.
          </h2>
          <p className="text-base leading-relaxed text-slate/75 md:text-lg">
            Clinical intelligence supports every workflow while clinicians remain responsible for every approved
            outcome. Capture → draft → approve — nothing reaches the record without a named clinical decision.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <div
                key={capability.id}
                className="flex flex-col rounded-2xl border border-navy/[0.08] bg-white/70 p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/[0.08]">
                    <Icon className="h-4 w-4 text-navy-dark" aria-hidden />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wide text-navy/55">{capability.category}</span>
                </div>
                <h3 className="mb-2 font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-navy-dark">
                  {capability.label}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-slate/80">{capability.description}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate/75">
          Clinician review always.{" "}
          <Link href="/how-it-works#pipeline" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            View the end-to-end workflow
          </Link>
          {" · "}
          <Link href="/platform#hitl" className="font-medium text-navy-dark underline-offset-4 hover:underline">
            Accept, Edit, or Reject
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
