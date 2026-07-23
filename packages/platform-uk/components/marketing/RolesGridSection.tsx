import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

type RoleSignal = {
  id: string;
  label: string;
  href: string;
  dashboard: string;
  description: string;
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
      "From the moment you open an appointment, the clinical context is ready. Documentation, drug safety, and risk signals are waiting in your review queue. You approve what goes in the record.",
  },
  {
    id: "nurse",
    label: "Nurse / Care Coordinator",
    href: "/for-clinicians",
    dashboard: "Nurse dashboard",
    description:
      "Vitals, observations, and handover notes in one place. Safety alerts appear before the ward round. Handover drafts from your entries — you review and approve before the night team receives them.",
  },
  {
    id: "pharmacist",
    label: "Clinical Pharmacist",
    href: "/for-clinicians",
    dashboard: "Pharmacist dashboard",
    description:
      "Medication reviews and interaction checks without switching tools. Type a proposed drug and get a BNF-referenced result. Every clinical rationale is recorded with your name attached.",
  },
];

const governanceRoles: RoleSignal[] = [
  {
    id: "admin",
    label: "Practice Administrator",
    href: "/for-practices",
    dashboard: "Admin · Audit",
    description:
      "Integration health, user management, and an immutable audit log in one view. Every clinical decision made on the platform is attributable, timestamped, and exportable.",
  },
  {
    id: "regional",
    label: "ICS / Regional Lead",
    href: "/for-ics",
    dashboard: "Regional dashboard",
    description:
      "Population signals aggregated from every connected practice. Condition prevalence, risk distribution, and service benchmarking — without patient-level data crossing organisational boundaries.",
  },
];

const reachRoles: RoleSignal[] = [
  {
    id: "hospital",
    label: "Hospital Executive",
    href: "/for-hospitals",
    dashboard: "Command centre",
    description:
      "Operational performance, service demand, and 14-day capacity signals in one command view. Every recommendation is logged and attributable.",
  },
  {
    id: "patient",
    label: "Patient (invited by your practice)",
    href: "/for-patients",
    dashboard: "My Health",
    description:
      "Your conditions, medications, and care plan in plain language. Check-ins, appointment records, and a way to tell your care team when something changes.",
  },
  {
    id: "research",
    label: "Researcher / Analyst",
    href: "/for-research",
    dashboard: "Informatics view",
    description:
      "Governed access to aggregate clinical data for service improvement and research. Individual patient data requires separate ethics approval. Provenance is recorded on every dataset.",
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
