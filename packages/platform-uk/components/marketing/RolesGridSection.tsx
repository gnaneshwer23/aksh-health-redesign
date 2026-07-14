import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

type RoleSignal = {
  id: string;
  label: string;
  href: string;
  dashboard: string;
  description: string;
  signals: string[];
  featured?: boolean;
};

type RolesGridSectionProps = {
  /** `platform` omits the self-referential platform link in the footer. */
  variant?: "home" | "platform";
};

const careRoles: RoleSignal[] = [
  {
    id: "gp",
    label: "GP",
    href: "/for-clinicians",
    dashboard: "Clinician dashboard",
    description:
      "Risk-ranked appointments, consult capture, SOAP drafts, and referral packages — all in one clinician review queue.",
    signals: ["Consult capture", "SOAP drafts", "Risk signals", "Review queue"],
    featured: true,
  },
  {
    id: "nurse",
    label: "Nurse / Care Coordinator",
    href: "/for-clinicians",
    dashboard: "Nurse dashboard",
    description: "Observations, structured handover, and safety alerts so care coordination stays with the patient.",
    signals: ["Vitals", "Handover", "Safety alerts"],
    featured: true,
  },
  {
    id: "pharmacist",
    label: "Clinical Pharmacist",
    href: "/for-clinicians",
    dashboard: "Pharmacist dashboard",
    description: "Medication review queue with interaction checks — flag aspirin + apixaban before it reaches the script.",
    signals: ["Med review", "Interactions", "BNF"],
    featured: true,
  },
];

const governanceRoles: RoleSignal[] = [
  {
    id: "admin",
    label: "Practice Admin",
    href: "/for-practices",
    dashboard: "Admin · Audit",
    description: "Integration health, tenancy controls, and immutable audit trails. Zero auto-writes.",
    signals: ["Audit", "Integrations", "ETL"],
  },
  {
    id: "regional",
    label: "ICS / Regional Lead",
    href: "/for-ics",
    dashboard: "Regional dashboard",
    description: "Population aggregates and equity insights across practices — no patient-level spill.",
    signals: ["Equity", "Cohorts", "Capacity"],
  },
];

const reachRoles: RoleSignal[] = [
  {
    id: "hospital",
    label: "Hospital Executive",
    href: "/for-hospitals",
    dashboard: "Command centre",
    description: "Capacity planning and trust-level oversight across connected pathways.",
    signals: ["Capacity", "Command"],
  },
  {
    id: "patient",
    label: "Patient",
    href: "/for-patients",
    dashboard: "My Health",
    description: "Invited by your GP practice. Support between appointments, never alone.",
    signals: ["Check-ins", "Plans"],
  },
  {
    id: "research",
    label: "Researcher / Analyst",
    href: "/for-research",
    dashboard: "Informatics view",
    description: "Governed outcome research with equity analysis and safety monitoring.",
    signals: ["Equity", "Cohorts"],
  },
];

function RoleSignals({ signals }: { signals: string[] }) {
  return (
    <ul className="owkin-roles__signals" aria-label="Product signals">
      {signals.map((signal) => (
        <li key={signal}>{signal}</li>
      ))}
    </ul>
  );
}

export default function RolesGridSection({ variant = "home" }: RolesGridSectionProps) {
  return (
    <section id="roles" className="owkin-roles scroll-mt-24" aria-labelledby="roles-heading">
      <div className={container}>
        <ScrollReveal className="owkin-roles__intro">
          <p className="owkin-roles__eyebrow">Every role, one platform</p>
          <h2 id="roles-heading" className="owkin-roles__title">
            Built for every role
          </h2>
          <p className="owkin-roles__lede">
            Eight purpose-built dashboards — from the Patel practice consult floor to regional equity views. Same
            governed care journey. Different work.
          </p>
        </ScrollReveal>

        <div className="owkin-roles__band">
          <ScrollReveal delayMs={60}>
            <p className="owkin-roles__band-label">Care delivery</p>
          </ScrollReveal>

          <ol className="owkin-roles__featured">
            {careRoles.map((role, index) => (
              <ScrollReveal key={role.id} delayMs={100 + index * 70} as="li">
                <Link href={role.href} className="owkin-roles__row owkin-roles__row--featured">
                  <span className="owkin-roles__index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="owkin-roles__body">
                    <div className="owkin-roles__meta">
                      <h3>{role.label}</h3>
                      <span className="owkin-roles__dashboard">{role.dashboard}</span>
                    </div>
                    <p>{role.description}</p>
                    <RoleSignals signals={role.signals} />
                  </div>
                  <span className="owkin-roles__cta">
                    Explore
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </ol>
        </div>

        <div className="owkin-roles__band">
          <ScrollReveal delayMs={80}>
            <p className="owkin-roles__band-label">Governance</p>
          </ScrollReveal>

          <div className="owkin-roles__governance">
            {governanceRoles.map((role, index) => (
              <ScrollReveal key={role.id} delayMs={120 + index * 70}>
                <Link href={role.href} className="owkin-roles__panel">
                  <div className="owkin-roles__meta">
                    <h3>{role.label}</h3>
                    <span className="owkin-roles__dashboard">{role.dashboard}</span>
                  </div>
                  <p>{role.description}</p>
                  <RoleSignals signals={role.signals} />
                  <span className="owkin-roles__cta">
                    Explore
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <div className="owkin-roles__band">
          <ScrollReveal delayMs={80}>
            <p className="owkin-roles__band-label">Systems &amp; people</p>
          </ScrollReveal>

          <div className="owkin-roles__reach">
            {reachRoles.map((role, index) => (
              <ScrollReveal key={role.id} delayMs={100 + index * 60}>
                <Link href={role.href} className="owkin-roles__reach-link">
                  <span className="owkin-roles__reach-copy">
                    <span className="owkin-roles__reach-label">{role.label}</span>
                    <span className="owkin-roles__dashboard">{role.dashboard}</span>
                    <span className="owkin-roles__reach-desc">{role.description}</span>
                  </span>
                  <span className="owkin-roles__cta" aria-hidden>
                    →
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>

        <ScrollReveal delayMs={140} className="owkin-roles__footer">
          {variant === "home" ? (
            <Link href="/platform#roles" className="owkin-text-cta">
              Explore roles on the platform
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link href="/for-clinicians" className="owkin-text-cta">
              Clinician workflows in depth
              <span aria-hidden>→</span>
            </Link>
          )}
          <Link href="/demo/patel" className="owkin-text-cta">
            Walk the Patel demo
            <span aria-hidden>→</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
