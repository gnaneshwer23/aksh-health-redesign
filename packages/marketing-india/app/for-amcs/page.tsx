import type { Metadata } from "next";

import { AudienceHero } from "@/components/marketing/audience-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProofGrid } from "@/components/marketing/proof-grid";
import { StatGrid } from "@/components/marketing/stat-grid";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { amcsPage, trustBadges } from "@/content/india-marketing";

export const metadata: Metadata = {
  title: amcsPage.metadata.title,
  description: amcsPage.metadata.description,
  openGraph: {
    title: amcsPage.metadata.title,
    description: amcsPage.metadata.description,
  },
};

export default function AmcsPage() {
  return (
    <MarketingShell>
      <AudienceHero hero={amcsPage.hero} />
      <TrustStrip badges={trustBadges} />
      <ProofGrid sections={amcsPage.sections} cards={amcsPage.proofCards} />
      <StatGrid stats={amcsPage.stats} />
      <CtaBand cta={amcsPage.cta} />
    </MarketingShell>
  );
}
