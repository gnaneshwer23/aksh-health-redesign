import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container, linkUnderline } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import type { AudiencePageContent } from "@/components/marketing/audience/audience-content";
import { AudienceAgentMapSection } from "@/components/marketing/audience/AudienceAgentMapSection";
import { AudienceWorkflowSection } from "@/components/marketing/audience/AudienceWorkflowSection";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import { PastelCapabilityCard } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";

export type AudiencePageLayoutProps = AudiencePageContent;

export function AudiencePageLayout({
  eyebrow,
  headline,
  subline,
  roles,
  problem,
  outcome,
  agentMap,
  workflow,
  ctaPrimary,
  ctaSecondary,
  ctaTertiary,
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
        {ctaTertiary ? (
          <p className="mt-4">
            <Link href={ctaTertiary.href} className={linkUnderline}>
              {ctaTertiary.label}
              <span aria-hidden className="ml-2">
                →
              </span>
            </Link>
          </p>
        ) : null}
      </MarketingPageHero>

      <TrustStrip />

      <section className="py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="The problem"
            title="What slows care today"
            description="One challenge. Then one clear outcome."
          />
          <div className="mt-6 max-w-3xl">
            <PastelCapabilityCard
              variant="peach"
              icon={problem.icon}
              title={problem.title}
              description={problem.body}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-navy/[0.06] py-12 md:py-16">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="The outcome"
            title="What changes"
            description="One outcome your team can feel in daily work."
          />
          <div className="mt-6 max-w-3xl">
            <PastelCapabilityCard
              variant="mint"
              icon={outcome.icon}
              title={outcome.title}
              description={outcome.body}
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href={ctaPrimary.href} className="owkin-btn-ink">
              {ctaPrimary.label}
            </Link>
            <Link href="/platform#agents" className={linkUnderline}>
              Twelve-agent roster
              <span aria-hidden className="ml-2">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <AudienceAgentMapSection agentMap={agentMap} />

      <AudienceWorkflowSection workflow={workflow} />

      <p className="mx-auto max-w-2xl px-4 pb-4 text-center text-sm leading-relaxed text-slate/75 sm:px-6">
        Clinician approval on every clinical output.{" "}
        <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
          Read clinical safety positioning
        </Link>
        .
      </p>

      <MarketingCtaBand
        title="Ready to talk?"
        lede={complianceNote}
        primary={ctaPrimary}
        secondary={ctaSecondary}
      />
    </MarketingShell>
  );
}
