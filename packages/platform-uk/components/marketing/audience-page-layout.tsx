import Link from "next/link";
import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";

export type AudiencePainPoint = {
  title: string;
  body: string;
};

export type AudienceFeature = {
  title: string;
  body: string;
};

export type AudienceCta = {
  label: string;
  href: string;
};

export type AudiencePageLayoutProps = {
  eyebrow: string;
  headline: string;
  subline: string;
  roles?: string[];
  pains: [AudiencePainPoint, AudiencePainPoint, AudiencePainPoint];
  features: [AudienceFeature, AudienceFeature, AudienceFeature];
  previewTitle: string;
  previewDescription: string;
  previewContent?: ReactNode;
  ctaPrimary: AudienceCta;
  ctaSecondary?: AudienceCta;
  complianceNote?: string;
};

export function AudiencePageLayout({
  eyebrow,
  headline,
  subline,
  roles,
  pains,
  features,
  previewTitle,
  previewDescription,
  previewContent,
  ctaPrimary,
  ctaSecondary,
  complianceNote,
}: AudiencePageLayoutProps) {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-medicom-navy pb-12 pt-8 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">{eyebrow}</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">{subline}</p>

          {roles && roles.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/85"
                >
                  {role}
                </span>
              ))}
            </div>
          )}

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
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-navy">Challenges we hear every day</h2>
            <p className="mt-3 text-steel">Built for NHS workflows with clinician approval on every output.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pains.map((pain) => (
              <article key={pain.title} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="text-lg font-bold text-navy">{pain.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{pain.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-3xl font-bold text-navy">How Aksh Health helps</h2>
            <p className="mt-3 text-steel">FHIR R4 ready outputs staged for review. Demo uses synthetic data.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-navy">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-navy">{previewTitle}</h2>
              <p className="mt-4 text-steel">{previewDescription}</p>
            </div>
            <div className="rounded-2xl border border-border bg-medicom-surface p-6 shadow-sm">
              {previewContent ?? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-navy/20 bg-white p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy/10">
                    <span className="text-2xl font-bold text-navy">A</span>
                  </div>
                  <p className="text-sm font-semibold text-navy">Dashboard preview</p>
                  <p className="mt-2 max-w-xs text-xs text-steel">
                    Synthetic patient data for demonstration. No live EHR connection in this build.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-emerald py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
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
