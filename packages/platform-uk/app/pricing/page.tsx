import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2, Hospital, Stethoscope } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { MarketingSectionHeader } from "@/components/marketing/MarketingSectionHeader";
import {
  bandPrimaryCta,
  bandSecondaryCta,
  btnPrimary,
  btnSecondary,
  container,
  heroPrimaryCta,
  heroSecondaryCta,
} from "@/components/marketing/marketing-ui";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How we price | Aksh Health",
  description:
    "How Aksh Health pricing works across single practices, multi-site organisations, and trust or ICS deployments. Speak to us for a quote tailored to your organisation.",
};

type PricingTier = {
  icon: LucideIcon;
  name: string;
  audience: string;
  summary: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
};

const tiers: PricingTier[] = [
  {
    icon: Stethoscope,
    name: "Practice",
    audience: "Single GP practice or small clinical team",
    summary:
      "For an individual practice getting started with clinician-reviewed AI drafting and safety checks on a small patient list.",
    features: [
      "GP, nurse, and pharmacist dashboards",
      "SYNTHESIS, GUARDIAN, and ORACLE agents",
      "Single review queue with full audit trail",
      "Standard onboarding and support",
    ],
    cta: { label: "Request organisation access", href: "/get-started" },
  },
  {
    icon: Building2,
    name: "Organisation",
    audience: "Multi-site practices and primary care networks",
    summary:
      "For groups of practices that need shared governance, tenancy controls, and performance visibility across sites.",
    features: [
      "Everything in Practice, across every site",
      "Practice manager and admin dashboards",
      "Cross-site tenancy and role management",
      "Priority integration support for EMIS Web and SystmOne",
    ],
    cta: { label: "Request organisation access", href: "/get-started" },
    highlighted: true,
  },
  {
    icon: Hospital,
    name: "Trust & ICS",
    audience: "Hospital trusts and integrated care systems",
    summary:
      "For trust executives and ICS leads who need population health, capacity forecasting, and system-wide governance.",
    features: [
      "Everything in Organisation, at system scale",
      "Hospital command centre and ICS dashboards",
      "EQUITY population health and benchmarking",
      "Dedicated implementation and governance support",
    ],
    cta: { label: "Talk to us", href: "/contact" },
  },
];

export default function PricingPage() {
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
          <p className="marketing-section-label mb-4">How we price</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl">
            Pricing scales with your organisation, not per patient record
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-steel sm:text-lg">
            Aksh Health is priced per organisation, based on the number of sites, roles, and integration paths you
            need. There are no per-patient fees. Speak to us for a quote tailored to your practice, trust, or ICS.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/get-started" className={`${heroPrimaryCta} sm:min-w-[11rem]`}>
              Request organisation access
            </Link>
            <Link href="/contact" className={`${heroSecondaryCta} sm:min-w-[11rem]`}>
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <section className="bg-surface-muted py-20 md:py-24">
        <div className={container}>
          <MarketingSectionHeader
            align="left"
            label="Three tiers"
            title="Built to match how NHS organisations are structured"
            description="Every tier includes clinician review on every AI output. Higher tiers add sites, roles, and governance depth. Get in touch for a quote; we do not publish list prices because deployment scope varies by organisation."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div
                  key={tier.name}
                  className={cn(
                    "flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all",
                    tier.highlighted ? "border-emerald/40 shadow-lg shadow-emerald/10 lg:-translate-y-2" : "border-border-subtle"
                  )}
                >
                  {tier.highlighted ? (
                    <span className="mb-4 inline-flex w-fit items-center rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald">
                      Most common
                    </span>
                  ) : null}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-navy/5">
                    <Icon className="h-5 w-5 text-navy" aria-hidden />
                  </div>
                  <h3 className="text-xl font-bold text-navy">{tier.name}</h3>
                  <p className="mt-1 text-sm font-medium text-emerald">{tier.audience}</p>
                  <p className="mt-4 text-sm leading-relaxed text-steel">{tier.summary}</p>

                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.cta.href}
                    className={cn("mt-8 w-full", tier.highlighted ? btnPrimary : btnSecondary)}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-steel">
            Pricing conversations happen with your practice manager, ICS lead, or trust procurement team once we
            understand your integration scope. Demo access with synthetic data is free to explore at any tier.
          </p>
        </div>
      </section>

      <section className="marketing-section-tight bg-emerald text-center text-white">
        <div className={`${container} max-w-2xl`}>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to talk pricing?</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Tell us about your organisation and we will scope a tier and quote that fits.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className={`${bandPrimaryCta} min-w-[11rem]`}>
              Request organisation access
            </Link>
            <Link href="/contact" className={`${bandSecondaryCta} min-w-[11rem]`}>
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
