import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import AccentStripe from "@/components/marketing/AccentStripe";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import NewsletterBand from "@/components/marketing/NewsletterBand";
import ProductFeatureBand from "@/components/marketing/ProductFeatureBand";
import StatsBand from "@/components/marketing/StatsBand";
import VisionStatement from "@/components/marketing/VisionStatement";
import WhatsNewSection from "@/components/marketing/WhatsNewSection";
import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const ScrollStorySection = dynamic(() => import("@/components/marketing/ScrollStorySection"), {
  loading: () => <div className="min-h-[40rem]" aria-hidden />,
});

const PlatformFlowSection = dynamic(() => import("@/components/marketing/PlatformFlowSection"), {
  loading: () => <div className="min-h-[20rem]" aria-hidden />,
});

const RolesGridSection = dynamic(() => import("@/components/marketing/RolesGridSection"), {
  loading: () => <div className="min-h-[20rem]" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <HeroSection />
      <VisionStatement />
      <ScrollStorySection />
      <AccentStripe />
      <ProductFeatureBand />
      <StatsBand />
      <WhatsNewSection />
      <PlatformFlowSection />
      <RolesGridSection />

      <section className={`${sectionTight} bg-[var(--owkin-ink)] text-center text-white`}>
        <div className={`${container} max-w-2xl`}>
          <h2 className="owkin-display mb-4 text-3xl text-white md:text-4xl">
            Ready to deploy across your organisation?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/70 md:text-xl">
            Eight role-specific dashboards. FHIR R4 ready, designed for EMIS Web and SystmOne. Clinical safety built
            in from day one.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/get-started" className="owkin-btn-ink !bg-white !text-[var(--owkin-ink)] hover:!bg-white/90">
              Request organisation access
            </Link>
            <Link href="/signup" className="owkin-text-cta !text-white !decoration-white/40 hover:!decoration-white">
              Create account
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      <NewsletterBand />
    </MarketingShell>
  );
}
