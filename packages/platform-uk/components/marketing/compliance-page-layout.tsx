import Link from "next/link";
import { FileText } from "lucide-react";

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

export type ComplianceSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type ComplianceCta = {
  label: string;
  href: string;
};

export type CompliancePageLayoutProps = {
  eyebrow: string;
  headline: string;
  subline: string;
  sections: ComplianceSection[];
  ctaPrimary: ComplianceCta;
  ctaSecondary?: ComplianceCta;
  complianceNote?: string;
};

export function CompliancePageLayout({
  eyebrow,
  headline,
  subline,
  sections,
  ctaPrimary,
  ctaSecondary,
  complianceNote,
}: CompliancePageLayoutProps) {
  return (
    <MarketingShell>
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
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel sm:text-lg">{subline}</p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={ctaPrimary.href} className={`${heroPrimaryCta} sm:min-w-[11rem]`}>
              {ctaPrimary.label}
            </Link>
            {ctaSecondary && (
              <Link href={ctaSecondary.href} className={`${heroSecondaryCta} sm:min-w-[11rem]`}>
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <PastelCapabilityCard
                key={section.title}
                variant={pastelVariantAt(index)}
                icon={FileText}
                title={section.title}
                description={section.body}
                compact
                footer={
                  section.bullets && section.bullets.length > 0 ? (
                    <ul className="mt-4 list-disc space-y-1.5 pl-4 text-sm text-steel">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section-tight bg-emerald text-center text-white">
        <div className={`${container} max-w-2xl`}>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to learn more?</h2>
          {complianceNote && <p className="mt-4 text-lg leading-relaxed text-white/80">{complianceNote}</p>}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={ctaPrimary.href} className={`${bandPrimaryCta} min-w-[11rem]`}>
              {ctaPrimary.label}
            </Link>
            {ctaSecondary && (
              <Link href={ctaSecondary.href} className={`${bandSecondaryCta} min-w-[11rem]`}>
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
