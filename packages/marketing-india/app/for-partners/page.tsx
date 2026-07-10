import type { Metadata } from "next";

import { AudienceHero } from "@/components/marketing/audience-hero";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PartnerAudienceCards } from "@/components/marketing/partner-audience-cards";
import { StatGrid } from "@/components/marketing/stat-grid";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { partnersPage, trustBadges } from "@/content/india-marketing";

export const metadata: Metadata = {
  title: partnersPage.metadata.title,
  description: partnersPage.metadata.description,
  openGraph: {
    title: partnersPage.metadata.title,
    description: partnersPage.metadata.description,
  },
};

export default function PartnersPage() {
  return (
    <MarketingShell>
      <AudienceHero hero={partnersPage.hero} />
      <TrustStrip badges={trustBadges} />
      {partnersPage.sections.map((section) => (
        <section className="product-section product-section--soft" key={section.title}>
          <div className="product-section-head">
            <p className="product-kicker">{section.kicker}</p>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </div>
        </section>
      ))}
      <PartnerAudienceCards audiences={partnersPage.partnerAudiences} />
      <StatGrid stats={partnersPage.stats} />
      <CtaBand cta={partnersPage.cta} />
    </MarketingShell>
  );
}
