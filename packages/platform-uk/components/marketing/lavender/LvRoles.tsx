import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Building2, FlaskConical, HeartPulse, Map, Pill, ShieldCheck, Stethoscope, UserRound } from "lucide-react";

type Role = {
  label: string;
  band: "Care delivery" | "Governance" | "Systems & people";
  dashboard: string;
  description: string;
  icon: LucideIcon;
  /** Only dashboards that open without sign-in get a direct link. */
  publicHref?: string;
};

const ROLES: Role[] = [
  {
    label: "Physician (GP / family doctor)",
    band: "Care delivery",
    dashboard: "Clinician dashboard",
    description: "Authorised context, documentation and safety drafts in one review queue.",
    icon: Stethoscope,
    publicHref: "/dashboard/gp",
  },
  {
    label: "Nurse / diabetes educator",
    band: "Care delivery",
    dashboard: "Nurse dashboard",
    description: "Vitals, handover notes and alerts, reviewed before they move on.",
    icon: HeartPulse,
  },
  {
    label: "Clinical Pharmacist",
    band: "Care delivery",
    dashboard: "Pharmacist dashboard",
    description: "Medication reviews and interaction checks, with a recorded rationale.",
    icon: Pill,
  },
  {
    label: "Practice Administrator",
    band: "Governance",
    dashboard: "Admin · Audit",
    description: "Users, integration health and an immutable audit log.",
    icon: ShieldCheck,
  },
  {
    label: "Population health lead",
    band: "Governance",
    dashboard: "Regional dashboard",
    description: "Population signals without patient-level data leaving the clinic.",
    icon: Map,
    publicHref: "/dashboard/ics",
  },
  {
    label: "Hospital Executive",
    band: "Systems & people",
    dashboard: "Command centre",
    description: "Demand and capacity signals for operational review.",
    icon: Building2,
  },
  {
    label: "Patient",
    band: "Systems & people",
    dashboard: "My Health",
    description: "Conditions, medicines and care plan in plain language, when invited by the practice.",
    icon: UserRound,
  },
  {
    label: "Researcher / Analyst",
    band: "Systems & people",
    dashboard: "Informatics view",
    description: "Governed aggregate access. Individual records need separate ethics approval.",
    icon: FlaskConical,
  },
];

type LvRolesProps = {
  variant?: "home" | "platform";
};

export default function LvRoles({ variant = "home" }: LvRolesProps) {
  return (
    <section id="roles" className="lv-section" aria-labelledby="lv-roles-title">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Designed around the people who deliver care</p>
            <h2 id="lv-roles-title" className="lv-h2 mt-3">
              {variant === "home" ? "One coordination layer. Different clinical realities." : "Designed for every role."}
            </h2>
          </div>
          <p className="lv-lede">
            Same governed queue, different work for each role. Each dashboard shows only what that role is
            authorised to see.
          </p>
        </div>

        <ul className="lv-roles">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <li key={role.label} className="lv-role">
                <div className="lv-role__art">
                  <span className="lv-role__icon" aria-hidden>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="lv-role__band">{role.band}</span>
                </div>
                <div className="lv-role__body">
                  <h3 className="lv-role__title">{role.label}</h3>
                  <p className="lv-role__dash">{role.dashboard}</p>
                  <p className="lv-role__desc">{role.description}</p>
                  {role.publicHref ? (
                    <Link href={role.publicHref} className="lv-btn lv-btn--violet mt-4 self-start">
                      Open synthetic demo
                    </Link>
                  ) : (
                    <p className="lv-role__note">Sign-in required</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-wrap gap-3">
          {variant === "home" ? (
            <Link href="/platform#roles" className="lv-btn lv-btn--outline">
              View roles on the platform
            </Link>
          ) : (
            <Link href="/get-started" className="lv-btn lv-btn--outline">
              Bring Aksh to your organisation
            </Link>
          )}
          <Link href="/demo/patel" className="lv-btn lv-btn--outline">
            Open Patel demo
          </Link>
        </div>
      </div>
    </section>
  );
}
