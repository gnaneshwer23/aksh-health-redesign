import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import type { AudiencePageContent } from "@/components/marketing/audience/audience-content";
import { AudienceWorkflowSection } from "@/components/marketing/audience/AudienceWorkflowSection";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";

export type AudiencePageLayoutProps = AudiencePageContent;

export function AudiencePageLayout({
  eyebrow,
  headline,
  subline,
  roles,
  painSection,
  pains,
  capabilitiesSection,
  capabilities,
  workflow,
  agentsSection,
  agents,
  ctaPrimary,
  ctaSecondary,
  complianceNote,
}: AudiencePageLayoutProps) {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow={eyebrow}
        title={headline}
        lede={subline}
        primary={ctaPrimary}
        secondary={ctaSecondary}
      >
        {roles && roles.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role} className="owkin-roles__dashboard">
                {role}
              </span>
            ))}
          </div>
        ) : null}
      </MarketingPageHero>

      <TrustStrip />

      <section className="py-16 md:py-20">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label={painSection.label}
            title={painSection.title}
            description={painSection.description}
          />
          <div className="grid gap-6 md:grid-cols-3">
            {pains.map((pain, index) => (
              <PastelCapabilityCard
                key={pain.title}
                variant={pastelVariantAt(index)}
                icon={pain.icon}
                title={pain.title}
                description={pain.body}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-navy/[0.06] py-16 md:py-20">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label={capabilitiesSection.label}
            title={capabilitiesSection.title}
            description={capabilitiesSection.description}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((feature, index) => (
              <PastelCapabilityCard
                key={feature.title}
                variant={pastelVariantAt(index)}
                icon={feature.icon}
                title={feature.title}
                description={feature.body}
                compact
              />
            ))}
          </div>
        </div>
      </section>

      <AudienceWorkflowSection workflow={workflow} />

      <section className="border-t border-navy/[0.06] py-16 md:py-20">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label={agentsSection.label}
            title={agentsSection.title}
            description={agentsSection.description}
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <PastelCapabilityCard
                key={agent.name}
                variant={pastelVariantAt(index)}
                icon={agent.icon}
                label={agent.tag}
                title={agent.name}
                description={agent.desc}
                compact
              />
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate/75">
            Human-in-the-loop on every clinical output.{" "}
            <Link href="/platform#hitl" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              See how Accept / Edit / Reject works
            </Link>{" "}
            or review{" "}
            <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              clinical safety positioning
            </Link>
            .
          </p>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to get started?"
        lede={complianceNote}
        primary={ctaPrimary}
        secondary={ctaSecondary}
      />
    </MarketingShell>
  );
}
