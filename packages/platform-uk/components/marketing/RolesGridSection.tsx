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

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";

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
    <section id="roles" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <MarketingSectionHeader
          align="center"
          label="Every role, one platform"
          title="Built for every role"
          description="Eight role-specific dashboards, each tuned to what that role needs to see and approve."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => (
            <PastelCapabilityCard
              key={role.label}
              variant={pastelVariantAt(index)}
              icon={role.icon}
              title={role.label}
              description={role.description}
              href={role.href}
              compact
              footer={
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
