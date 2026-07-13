import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import StatsBand from "@/components/marketing/StatsBand";
import AboutStatsSection from "@/components/marketing/AboutStatsSection";
import PlatformMetricsSection from "@/components/marketing/PlatformMetricsSection";
import { bandPrimaryCta, bandSecondaryCta, container, sectionTight } from "@/components/marketing/marketing-ui";
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
    <MarketingShell overDarkHero>
      <HeroSection />
      <PlatformMetricsSection />
      <StatsBand />
      <AboutStatsSection />
      <PlatformFlowSection />
      <RolesGridSection />

      <section className={`${sectionTight} bg-emerald text-center text-white`}>
        <div className={`${container} max-w-2xl`}>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to deploy across your organisation?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/80 md:text-xl">
            Eight role-specific dashboards. FHIR R4 ready, designed for EMIS Web and SystmOne. Clinical safety built
            in from day one.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className={`${bandPrimaryCta} min-w-[11rem]`}>
              Request organisation access
            </Link>
            <Link href="/signup" className={`${bandSecondaryCta} min-w-[11rem]`}>
              Create account
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
