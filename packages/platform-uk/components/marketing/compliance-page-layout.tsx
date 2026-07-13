import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";
import { FileText } from "lucide-react";

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
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow={eyebrow}
        title={headline}
        lede={subline}
        primary={ctaPrimary}
        secondary={ctaSecondary}
      />

      <TrustStrip />

      <section className="py-16 md:py-20">
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

      <MarketingCtaBand
        title="Ready to learn more?"
        lede={complianceNote}
        primary={ctaPrimary}
        secondary={ctaSecondary}
      />
    </MarketingShell>
  );
}
