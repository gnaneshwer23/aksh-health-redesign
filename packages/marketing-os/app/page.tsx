import type { Metadata } from "next";

import { AgentEcosystem } from "@/components/marketing/AgentEcosystem";
import { CarePathwaySection } from "@/components/marketing/CarePathwaySection";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { DigitalTwinSection } from "@/components/marketing/DigitalTwinSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { PilotCTA } from "@/components/marketing/PilotCTA";
import { PlatformLayerDiagram } from "@/components/marketing/PlatformLayerDiagram";
import { ProblemStatement } from "@/components/marketing/ProblemStatement";
import { UseCaseCarousel } from "@/components/marketing/UseCaseCarousel";
import { VoiceAgentDemo } from "@/components/marketing/VoiceAgentDemo";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Healthcare Has Data. Now It Has Intelligence.",
  "Aksh Health is the AI Healthcare Operating System connecting EMIS, SystmOne, Epic, and NHS infrastructure to specialist AI agents."
);

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemStatement />
      <PlatformLayerDiagram />
      <HowItWorks />
      <AgentEcosystem />
      <VoiceAgentDemo />
      <DigitalTwinSection />
      <CarePathwaySection />
      <ComparisonTable />
      <UseCaseCarousel />
      <PilotCTA />
    </>
  );
}
