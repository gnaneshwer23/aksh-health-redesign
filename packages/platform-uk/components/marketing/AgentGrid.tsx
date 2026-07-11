import { FileText, Scale, Send, Shield, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const agents: {
  name: string;
  tag: string;
  color: string;
  iconBg: string;
  icon: LucideIcon;
  desc: string;
  fhir: string;
}[] = [
  {
    name: "SYNTHESIS",
    tag: "Clinical",
    color: "text-navy",
    iconBg: "bg-navy/10",
    icon: FileText,
    desc: "Converts voice or typed consultation notes into structured SOAP notes in 4 seconds.",
    fhir: "DocumentReference",
  },
  {
    name: "GUARDIAN",
    tag: "Safety",
    color: "text-danger",
    iconBg: "bg-danger/10",
    icon: Shield,
    desc: "Real-time drug interaction, allergy, and contraindication checking. BNF-validated. Red / Amber / Green.",
    fhir: "Flag, MedicationRequest",
  },
  {
    name: "ORACLE",
    tag: "Risk",
    color: "text-warning",
    iconBg: "bg-warning/10",
    icon: TrendingUp,
    desc: "CVD, T2D, and frailty risk scoring. 14-day hospital admission prediction using the knowledge graph.",
    fhir: "RiskAssessment",
  },
  {
    name: "EQUITY",
    tag: "Population",
    color: "text-emerald",
    iconBg: "bg-emerald/10",
    icon: Scale,
    desc: "Detects health disparities by IMD quintile and ethnicity. Monthly ICS equity reports.",
    fhir: "Observation (flag)",
  },
  {
    name: "SHIELD",
    tag: "Compliance",
    color: "text-slate",
    iconBg: "bg-surface-muted",
    icon: Shield,
    desc: "Immutable audit trail for every AI recommendation and GP action. DCB0129-compliant. CQC-ready.",
    fhir: "AuditEvent",
  },
  {
    name: "REFERRAL AGENT",
    tag: "Coordination",
    color: "text-navy",
    iconBg: "bg-navy/10",
    icon: Send,
    desc: "Auto-generates referral packages: criteria check, missing investigations, urgency prediction.",
    fhir: "ServiceRequest",
  },
];

export default function AgentGrid() {
  return (
    <section className="bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="marketing-section-label mb-3">AI agents</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Twelve AI Agents. Every Role. One Platform.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-steel md:text-xl">
            Each agent has memory, permissions, and a human-approval gate before any action is taken.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-6"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${agent.iconBg}`}>
                  <Icon className={`h-5 w-5 ${agent.color}`} aria-hidden />
                </div>
                <div className={`mb-2 text-xs font-bold uppercase tracking-wide ${agent.color}`}>{agent.name}</div>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-steel">
                  <Users className="h-3 w-3" aria-hidden />
                  {agent.tag}
                </div>
                <p className="mb-3 text-sm leading-relaxed text-slate">{agent.desc}</p>
                <div className="rounded-lg bg-surface px-2.5 py-1.5 text-xs text-steel/80">
                  <span className="font-semibold text-steel">FHIR:</span> {agent.fhir}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald/20 bg-emerald/5 p-8 text-center">
          <p className="mb-2 text-lg font-semibold text-emerald">Human-in-the-Loop. Always.</p>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-steel">
            Every AI output is staged as a Draft. The clinician clicks Accept, Edit, or Reject. Zero AI outputs are
            written to the FHIR record without explicit human approval.
          </p>
        </div>
      </div>
    </section>
  );
}
