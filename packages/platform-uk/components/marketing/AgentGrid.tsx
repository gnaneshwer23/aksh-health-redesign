import {
  Activity,
  FileCode2,
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
    icon: FileCode2,
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
        <div className="mb-10 max-w-2xl">
          <p className="owkin-roles__eyebrow mb-3">Clinical capabilities</p>
          <h2 className="mb-4 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mk-ink)] md:text-4xl">
            Supporting intelligence. One review queue.
          </h2>
          <p className="text-base leading-relaxed text-[var(--mk-muted)]">
            Capture → draft → approve. Supporting intelligence stays in the queue until a named clinician decides.
          </p>
        </div>

        <ul className="aksh-capability-list">
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <li key={capability.id} className="aksh-capability-list__item">
                <div className="aksh-capability-list__icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="aksh-capability-list__copy">
                  <div className="aksh-capability-list__meta">
                    <h3>{capability.label}</h3>
                    <span>{capability.category}</span>
                  </div>
                  <p>{capability.description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 max-w-2xl text-sm leading-relaxed text-[var(--mk-muted)]">
          Clinician review always.{" "}
          <Link href="/platform#hitl" className="font-medium text-[var(--mk-accent-strong)] underline-offset-4 hover:underline">
            Accept, Edit, or Reject
          </Link>
          {" · "}
          <Link href="/demo/patel" className="font-medium text-[var(--mk-accent-strong)] underline-offset-4 hover:underline">
            Open walkthrough
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
