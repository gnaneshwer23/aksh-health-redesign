import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  FlaskConical,
  HeartPulse,
  Network,
  Pill,
  Stethoscope,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";

import { container, section } from "@/components/marketing/marketing-ui";

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
    <section id="roles" className={`${section} bg-white`}>
      <div className={container}>
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <p className="marketing-section-label mb-4">Every role, one platform</p>
          <h2 className="marketing-display-title mb-4 text-[clamp(1.85rem,3.4vw,2.75rem)] text-navy-dark">
            Built for every role
          </h2>
          <p className="text-base leading-relaxed text-slate/75 sm:text-lg">
            Eight role-specific dashboards, each tuned to what that role needs to see and approve.
          </p>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-navy/[0.08] bg-navy/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.label}
                href={role.href}
                className="group flex h-full flex-col bg-white p-6 transition-colors hover:bg-[#f5f8fb] sm:p-7"
              >
                <Icon className="mb-5 h-5 w-5 text-navy/55 transition-colors group-hover:text-emerald" aria-hidden />
                <h3 className="marketing-display-title mb-2 text-lg text-navy-dark">{role.label}</h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-slate/70">{role.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-dark">
                  Learn more
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
