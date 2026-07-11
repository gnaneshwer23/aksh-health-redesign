import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  FlaskConical,
  HeartPulse,
  Network,
  Pill,
  Stethoscope,
  TrendingUp,
  User,
} from "lucide-react";

const roles: Array<{ label: string; description: string; href: string; icon: LucideIcon }> = [
  { label: "GP", description: "AI-assisted clinical documentation", href: "/for-clinicians", icon: Stethoscope },
  { label: "Nurse / Care Coordinator", description: "Vitals, handover, and care coordination", href: "/for-clinicians", icon: HeartPulse },
  { label: "Clinical Pharmacist", description: "Medication review and safety checks", href: "/for-clinicians", icon: Pill },
  { label: "Practice Manager", description: "Practice operations and integrations", href: "/for-administrators", icon: Building2 },
  { label: "ICS Lead", description: "Population intelligence across integrated care", href: "/for-ics", icon: Network },
  { label: "Hospital Executive", description: "Command centre and capacity planning", href: "/for-hospitals", icon: TrendingUp },
  { label: "Patient", description: "Invited by your GP practice", href: "/for-patients", icon: User },
  { label: "Researcher / Analyst", description: "Clinical informatics and outcome research", href: "/for-research", icon: FlaskConical },
];

export default function RolesGridSection() {
  return (
    <section className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="marketing-section-label mb-3">Every role, one platform</p>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">Built for every role</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-steel">
            Eight role-specific dashboards, each tuned to what that role needs to see and approve.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.label}
                href={role.href}
                className="marketing-capability-card group flex flex-col rounded-2xl border border-border-subtle bg-white p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/[0.06] text-navy transition-colors group-hover:bg-emerald group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold text-navy">{role.label}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-steel">{role.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
