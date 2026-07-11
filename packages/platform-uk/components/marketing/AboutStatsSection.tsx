import { CheckCircle2, FileStack, ShieldCheck } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";

const previewPanels: Array<{
  label: string;
  title: string;
  body: string;
  icon: typeof ShieldCheck;
  variant: PastelVariant;
}> = [
  {
    label: "Review",
    title: "Human review, every time",
    body: "Every agent output lands in a review queue. Clinicians accept, edit, or reject before anything reaches the record.",
    icon: ShieldCheck,
    variant: "blue",
  },
  {
    label: "Staging",
    title: "FHIR R4 staging",
    body: "Approved outputs stage as FHIR resources with an immutable audit trail, ready for EMIS Web and SystmOne.",
    icon: FileStack,
    variant: "mint",
  },
];

export default function AboutStatsSection() {
  return (
    <section className="marketing-soft-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <MarketingSectionHeader
              align="left"
              className="mb-0 md:mb-0"
              label="Our platform"
              title="Built for every stage of clinical care"
              description="One platform standing beside your clinical team: specialist agents draft, check, and coordinate, while clinicians stay in control of every decision that reaches the record."
            />

            <ul className="mt-8 space-y-3">
              {[
                "Designed for EMIS Web and SystmOne integration paths",
                "Twelve specialist agents covering clinical, safety, and operational work",
                "Nothing writes to the record without clinician approval",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {previewPanels.map((panel) => (
              <PastelCapabilityCard
                key={panel.title}
                variant={panel.variant}
                icon={panel.icon}
                label={panel.label}
                title={panel.title}
                description={panel.body}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
