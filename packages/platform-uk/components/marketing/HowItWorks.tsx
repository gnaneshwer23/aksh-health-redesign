import { Brain, Link2, ShieldCheck, Sparkles } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import type { PastelVariant } from "@/components/marketing/PastelCapabilityCard";

const steps: Array<{
  num: string;
  variant: PastelVariant;
  icon: typeof Link2;
  label: string;
  title: string;
  body: string;
}> = [
  {
    num: "01",
    variant: "blue",
    icon: Link2,
    label: "Connect",
    title: "One platform. Every system.",
    body: "Designed to integrate with EMIS Web and SystmOne via FHIR R4 and HL7 v2. No migration project and no rip-and-replace. Current demo uses synthetic patient data; production integration paths are on the roadmap.",
  },
  {
    num: "02",
    variant: "mint",
    icon: Brain,
    label: "Understand",
    title: "A knowledge graph that reasons.",
    body: "Each patient record becomes a connected model in Neo4j: conditions linked to risks, medications to interactions, history to predictions. Twelve specialist agents run in parallel to surface insights.",
  },
  {
    num: "03",
    variant: "lavender",
    icon: ShieldCheck,
    label: "Act",
    title: "Twelve AI agents. One review queue.",
    body: "SYNTHESIS writes your SOAP note. DrASSIST codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a Draft in your Review Queue. Nothing writes to the FHIR record until you click Accept.",
  },
  {
    num: "04",
    variant: "peach",
    icon: Sparkles,
    label: "Learn",
    title: "Every outcome improves the system.",
    body: "Approved decisions feed back into the knowledge graph. Rejected outputs inform model refinement. The platform improves with every consultation across practices in your ICS.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <MarketingSectionHeader
          align="split"
          label="Popular capabilities"
          title="From fragmented data to coordinated care"
          link={{ href: "/how-it-works", label: "See how it works" }}
        />

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
