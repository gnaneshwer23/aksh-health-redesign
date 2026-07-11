import Link from "next/link";

import type { AudiencePageContent } from "@/components/marketing/audience/audience-content";
import { AudienceWorkflowSection } from "@/components/marketing/audience/AudienceWorkflowSection";
import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import {
  bandPrimaryCta,
  bandSecondaryCta,
  container,
  heroPrimaryCta,
  heroSecondaryCta,
} from "@/components/marketing/marketing-ui";
import { MarketingShell } from "@/components/marketing/MarketingShell";
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
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-light via-white to-white">
        <div
          className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-24 top-0 h-[24rem] w-[24rem] opacity-[0.12]"
          aria-hidden
        />
        <div
          className="marketing-hero-blob marketing-hero-blob--navy absolute -left-28 top-16 h-[22rem] w-[22rem] opacity-[0.08]"
          aria-hidden
        />

        <div className={`relative ${container} py-20 md:py-24 lg:py-28`}>
          <p className="marketing-section-label mb-4">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel sm:text-lg">{subline}</p>

          {roles && roles.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-border-subtle bg-white px-3.5 py-1.5 text-xs font-medium text-navy shadow-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={ctaPrimary.href} className={`${heroPrimaryCta} sm:min-w-[11rem]`}>
              {ctaPrimary.label}
            </Link>
            <Link href={ctaSecondary.href} className={`${heroSecondaryCta} sm:min-w-[11rem]`}>
              {ctaSecondary.label}
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      {/* Pain points */}
      <section className="bg-surface-muted py-20 md:py-24">
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

      {/* Capabilities */}
      <section className="bg-white py-20 md:py-24">
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

      {/* Agents */}
      <section className="bg-white py-20 md:py-24">
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

          <div className="mt-10 rounded-2xl border border-emerald/20 bg-emerald/5 p-8 text-center">
            <p className="mb-2 text-lg font-semibold text-emerald">Human-in-the-loop. Always.</p>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-steel">
              Every AI output is staged as a draft. The clinician clicks Accept, Edit, or Reject. Zero AI outputs are
              written to the FHIR record without explicit human approval.
            </p>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="marketing-section-tight bg-emerald text-center text-white">
        <div className={`${container} max-w-2xl`}>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to get started?</h2>
          {complianceNote && <p className="mt-4 text-sm leading-relaxed text-white/80">{complianceNote}</p>}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={ctaPrimary.href} className={`${bandPrimaryCta} min-w-[11rem]`}>
              {ctaPrimary.label}
            </Link>
            <Link href={ctaSecondary.href} className={`${bandSecondaryCta} min-w-[11rem]`}>
              {ctaSecondary.label}
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
