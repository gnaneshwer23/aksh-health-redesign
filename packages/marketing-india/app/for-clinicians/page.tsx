import type { Metadata } from "next";

import { AudienceHero } from "@/components/marketing/audience-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProofGrid } from "@/components/marketing/proof-grid";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import { cliniciansPage, trustBadges } from "@/content/india-marketing";

export const metadata: Metadata = {
  title: cliniciansPage.metadata.title,
  description: cliniciansPage.metadata.description,
  openGraph: {
    title: cliniciansPage.metadata.title,
    description: cliniciansPage.metadata.description,
  },
};

export default function CliniciansPage() {
  return (
    <MarketingShell>
      <AudienceHero hero={cliniciansPage.hero} />
      <TrustStrip badges={trustBadges} />
      <ProofGrid sections={cliniciansPage.sections} cards={cliniciansPage.proofCards} />
      <WorkflowSteps
        id="workflow"
        section={cliniciansPage.workflowSection}
        steps={cliniciansPage.workflow}
      />
      <CtaBand cta={cliniciansPage.cta} />
    </MarketingShell>
  );
}
