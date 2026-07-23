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
      "Manage consultations, review structured drafts, approve referrals, and monitor clinical risk from one workspace.",
    signals: ["Consult capture", "SOAP drafts", "Risk signals", "Review queue"],
    featured: true,
  },
  {
    id: "nurse",
    label: "Nurse / Care Coordinator",
    href: "/for-clinicians",
    dashboard: "Nurse dashboard",
    description: "Manage observations, handovers, and safety alerts across the patient journey.",
    signals: ["Vitals", "Handover", "Safety alerts"],
    featured: true,
  },
  {
    id: "pharmacist",
    label: "Clinical Pharmacist",
    href: "/for-clinicians",
    dashboard: "Pharmacist dashboard",
    description: "Review medications, identify interactions, and support safer prescribing.",
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
    description: "Integration health, tenancy controls, and immutable audit trails across the practice.",
    signals: ["Audit", "Integrations", "ETL"],
  },
  {
    id: "regional",
    label: "ICS / Regional Lead",
    href: "/for-ics",
    dashboard: "Regional dashboard",
    description: "Monitor service performance and population health across connected organisations.",
    signals: ["Equity", "Cohorts", "Capacity"],
  },
];

const reachRoles: RoleSignal[] = [
  {
    id: "hospital",
    label: "Hospital Executive",
    href: "/for-hospitals",
    dashboard: "Command centre",
    description: "View operational performance, service demand, and system wide capacity.",
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
    description: "Explore governed datasets for service improvement and clinical research.",
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
          <p className="owkin-roles__eyebrow">One platform</p>
          <h2 id="roles-heading" className="owkin-roles__title">
            One platform.
            <span className="block">Designed for every role.</span>
          </h2>
          <p className="owkin-roles__lede">
            Purpose-built workspaces for care teams, governance leads, and partners — same coordinated journey,
            different work.
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
                    View workspace
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
                    Open dashboard
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
              View roles on the platform
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <Link href="/for-clinicians" className="owkin-text-cta">
              View clinician workspace
              <span aria-hidden>→</span>
            </Link>
          )}
          <Link href="/demo/patel" className="owkin-text-cta">
            Open Patel demo
            <span aria-hidden>→</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
