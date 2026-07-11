import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
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
    <MarketingShell overDarkHero>
      <section className="relative overflow-hidden bg-medicom-navy pb-12 pt-24 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">{subline}</p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href={ctaPrimary.href}
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              {ctaPrimary.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="rounded-xl border-2 border-white/70 px-8 py-3.5 text-center text-base font-bold text-white transition-all hover:bg-white/10"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
        <TrustStrip />
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-xl font-bold text-navy">{section.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-steel">{section.body}</p>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-steel">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to learn more?</h2>
          {complianceNote && <p className="mt-4 text-sm text-white/80">{complianceNote}</p>}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={ctaPrimary.href}
              className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald transition-colors hover:bg-white/90"
            >
              {ctaPrimary.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                {ctaSecondary.label}
              </Link>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
