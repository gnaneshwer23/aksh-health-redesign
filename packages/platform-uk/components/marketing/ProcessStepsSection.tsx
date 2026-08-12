import { ClipboardList, FileCheck2, UserCheck } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";

const steps: Array<{
  num: string;
  variant: PastelVariant;
  icon: typeof ClipboardList;
  label: string;
  title: string;
  body: string;
}> = [
  {
    num: "01",
    variant: "blue",
    icon: ClipboardList,
    label: "Capture",
    title: "Capture the consult",
    body: "Notes or voice during the appointment. Clinical context from your existing EHR.",
  },
  {
    num: "02",
    variant: "mint",
    icon: FileCheck2,
    label: "Draft",
    title: "Draft + checks",
    body: "Structured notes, safety flags, and referral packages stage for review — never auto-written.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: UserCheck,
    label: "Approve",
    title: "Clinician approves",
    body: "Accept, edit, or reject. Only approved content can progress toward the record.",
  },
];

export default function ProcessStepsSection() {
  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <MarketingSectionHeader
          align="center"
          label="The journey"
          title="Three steps to a governed record"
          className="mb-8 md:mb-10"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <PastelCapabilityCard
              key={step.num}
              variant={step.variant}
              icon={step.icon}
              stepNumber={step.num}
              label={step.label}
              title={step.title}
              description={step.body}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
