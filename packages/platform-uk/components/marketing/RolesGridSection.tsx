import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

type RoleSignal = {
  id: string;
  label: string;
  dashboard: string;
  description: string;
};

type RolesGridSectionProps = {
  variant?: "home" | "platform";
};

const careRoles: RoleSignal[] = [
  {
    id: "gp",
    label: "GP",
    dashboard: "Clinician dashboard",
    description: "Consult context, documentation, and safety drafts in one review queue.",
  },
  {
    id: "nurse",
    label: "Nurse / Care Coordinator",
    dashboard: "Nurse dashboard",
    description: "Vitals, handover notes, and alerts — reviewed before they move on.",
  },
  {
    id: "pharmacist",
    label: "Clinical Pharmacist",
    dashboard: "Pharmacist dashboard",
    description: "Medication reviews and interaction checks, with a recorded rationale.",
  },
];

const governanceRoles: RoleSignal[] = [
  {
    id: "admin",
    label: "Practice Administrator",
    dashboard: "Admin · Audit",
    description: "Users, integration health, and an immutable audit log.",
  },
  {
    id: "regional",
    label: "ICS / Regional Lead",
    dashboard: "Regional dashboard",
    description: "Population signals without patient-level data leaving the practice.",
  },
];

const reachRoles: RoleSignal[] = [
  {
    id: "hospital",
    label: "Hospital Executive",
    dashboard: "Command centre",
    description: "Demand and capacity signals for operational review.",
  },
  {
    id: "patient",
    label: "Patient (invited by your practice)",
    dashboard: "My Health",
    description: "Conditions, medications, and care plan in plain language.",
  },
  {
    id: "research",
    label: "Researcher / Analyst",
    dashboard: "Informatics view",
    description: "Governed aggregate access. Individual records need separate approval.",
  },
];

export default function RolesGridSection({ variant = "home" }: RolesGridSectionProps) {
  return (
    <section id="roles" className="owkin-roles scroll-mt-24" aria-labelledby="roles-heading" data-section="09">
      <div className={container}>
        <ScrollReveal className="owkin-roles__intro">
          <p className="owkin-roles__eyebrow">One platform</p>
          <h2 id="roles-heading" className="owkin-roles__title">
            One platform.
            <span className="block">Designed for every role.</span>
          </h2>
          <p className="owkin-roles__lede">
            The same coordination layer — different work for each role.
          </p>
        </ScrollReveal>

        <div className="owkin-roles__band">
          <ScrollReveal delayMs={60}>
            <p className="owkin-roles__band-label">Care delivery</p>
          </ScrollReveal>

          <ol className="owkin-roles__featured">
            {careRoles.map((role, index) => (
              <ScrollReveal key={role.id} delayMs={100 + index * 70} as="li">
                <article className="owkin-roles__row owkin-roles__row--featured">
                  <span className="owkin-roles__index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="owkin-roles__body">
                    <div className="owkin-roles__meta">
                      <h3>{role.label}</h3>
                      <span className="owkin-roles__dashboard">{role.dashboard}</span>
                    </div>
                    <p>{role.description}</p>
                  </div>
                </article>
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
                <article className="owkin-roles__panel">
                  <div className="owkin-roles__meta">
                    <h3>{role.label}</h3>
                    <span className="owkin-roles__dashboard">{role.dashboard}</span>
                  </div>
                  <p>{role.description}</p>
                </article>
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
                <article className="owkin-roles__reach-link">
                  <span className="owkin-roles__reach-copy">
                    <span className="owkin-roles__reach-label">{role.label}</span>
                    <span className="owkin-roles__dashboard">{role.dashboard}</span>
                    <span className="owkin-roles__reach-desc">{role.description}</span>
                  </span>
                </article>
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
            <Link href="/get-started" className="owkin-text-cta">
              Request organisation access
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
