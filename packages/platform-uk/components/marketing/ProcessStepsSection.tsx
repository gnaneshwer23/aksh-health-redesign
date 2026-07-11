import { ClipboardList, FileCheck2, ShieldCheck, UserCheck } from "lucide-react";

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
    label: "Intake",
    title: "Clinical intake",
    body: "Consultation notes, vitals, and history flow in from EMIS Web or SystmOne, ready for the knowledge graph.",
  },
  {
    num: "02",
    variant: "mint",
    icon: FileCheck2,
    label: "Draft",
    title: "Agent drafts",
    body: "Specialist agents draft SOAP notes, safety checks, and risk scores in parallel, each scoped to its role.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: UserCheck,
    label: "Review",
    title: "HITL review",
    body: "Every draft lands in the clinician's review queue. Accept, edit, or reject; nothing proceeds unseen.",
  },
  {
    num: "04",
    variant: "peach",
    icon: ShieldCheck,
    label: "Stage",
    title: "FHIR staging",
    body: "Approved outputs stage as FHIR R4 resources with a full audit trail, ready for the record.",
  },
];

export default function ProcessStepsSection() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <MarketingSectionHeader align="center" label="The journey" title="Start your clinical workflow" className="mb-10 md:mb-12" />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
