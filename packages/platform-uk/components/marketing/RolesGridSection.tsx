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
    description: "Authorised context, documentation, and safety drafts in one review queue.",
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
    label: "Regional / population lead",
    dashboard: "Regional dashboard",
    description: "Population signals without patient-level data leaving the clinic.",
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

function RoleRow({ role, index }: { role: RoleSignal; index: number }) {
  return (
    <li className="aksh-role-row">
      <span className="aksh-role-row__index" aria-hidden>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="aksh-role-row__body">
        <div className="aksh-role-row__meta">
          <h3>{role.label}</h3>
          <span className="owkin-roles__dashboard">{role.dashboard}</span>
        </div>
        <p>{role.description}</p>
      </div>
    </li>
  );
}

export default function RolesGridSection({ variant = "home" }: RolesGridSectionProps) {
  let counter = 0;

  return (
    <section id="roles" className="owkin-roles scroll-mt-24" aria-labelledby="roles-heading" data-section="09">
      <div className={container}>
        <ScrollReveal className="owkin-roles__intro">
          <p className="owkin-roles__eyebrow">Roles</p>
          <h2 id="roles-heading" className="owkin-roles__title">
            Designed for every role.
          </h2>
          <p className="owkin-roles__lede">Same coordination layer. Different work for each role.</p>
        </ScrollReveal>

        <div className="owkin-roles__band">
          <p className="owkin-roles__band-label">Care delivery</p>
          <ol className="aksh-role-list">
            {careRoles.map((role) => {
              counter += 1;
              return <RoleRow key={role.id} role={role} index={counter - 1} />;
            })}
          </ol>
        </div>

        <div className="owkin-roles__band">
          <p className="owkin-roles__band-label">Governance</p>
          <ol className="aksh-role-list">
            {governanceRoles.map((role) => {
              counter += 1;
              return <RoleRow key={role.id} role={role} index={counter - 1} />;
            })}
          </ol>
        </div>

        <div className="owkin-roles__band">
          <p className="owkin-roles__band-label">Systems &amp; people</p>
          <ol className="aksh-role-list">
            {reachRoles.map((role) => {
              counter += 1;
              return <RoleRow key={role.id} role={role} index={counter - 1} />;
            })}
          </ol>
        </div>

        <div className="owkin-roles__footer">
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
        </div>
      </div>
    </section>
  );
}
