import type { Metadata } from "next";

import { AudienceHero } from "@/components/marketing/audience-hero";
import { CapabilityGrid } from "@/components/marketing/capability-grid";
import { CtaBand } from "@/components/marketing/cta-band";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { RoleCards } from "@/components/marketing/role-cards";
import { StatGrid } from "@/components/marketing/stat-grid";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import { homePage, trustBadges } from "@/content/india-marketing";

export const metadata: Metadata = {
  title: homePage.metadata.title,
  description: homePage.metadata.description,
  openGraph: {
    title: homePage.metadata.title,
    description: homePage.metadata.description,
  },
};

export default function HomePage() {
  return (
    <MarketingShell>
      <AudienceHero hero={homePage.hero} />
      <TrustStrip badges={trustBadges} />
      <StatGrid stats={homePage.stats} />
      <CapabilityGrid section={homePage.capabilitiesSection} capabilities={homePage.capabilities} />
      <WorkflowSteps section={homePage.howItWorksSection} steps={homePage.howItWorks} />
      <Testimonials
        description={homePage.testimonialsSection.description}
        items={homePage.testimonials}
        kicker={homePage.testimonialsSection.kicker}
        title={homePage.testimonialsSection.title}
      />
      <RoleCards section={homePage.rolesSection} roles={homePage.roles} />
      <CtaBand cta={homePage.cta} />
    </MarketingShell>
  );
}
