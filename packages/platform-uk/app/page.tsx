import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import StatsBand from "@/components/marketing/StatsBand";
import AboutStatsSection from "@/components/marketing/AboutStatsSection";
import PlatformMetricsSection from "@/components/marketing/PlatformMetricsSection";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const PlatformFlowSection = dynamic(() => import("@/components/marketing/PlatformFlowSection"), {
  loading: () => <div className="min-h-[20rem] bg-surface-muted" aria-hidden />,
});

const RolesGridSection = dynamic(() => import("@/components/marketing/RolesGridSection"), {
  loading: () => <div className="min-h-[20rem] bg-white" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <MarketingShell className="overflow-x-hidden">
      <HeroSection />
      <PlatformMetricsSection />
      <StatsBand />
      <AboutStatsSection />
      <PlatformFlowSection />
      <RolesGridSection />

      <section className="bg-emerald py-20 text-center text-white md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to deploy across your organisation?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/80 md:text-xl">
            Eight role-specific dashboards. FHIR R4 ready, designed for EMIS Web and SystmOne. Clinical safety built
            in from day one.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-block min-w-[11rem] rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-emerald shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Request organisation access
            </Link>
            <Link
              href="/signup"
              className="inline-block min-w-[11rem] rounded-xl border border-white/40 px-8 py-3.5 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
