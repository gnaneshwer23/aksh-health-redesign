import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import AccentStripe from "@/components/marketing/AccentStripe";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import ProductFeatureBand from "@/components/marketing/ProductFeatureBand";
import StatsBand from "@/components/marketing/StatsBand";
import WhatsNewSection from "@/components/marketing/WhatsNewSection";
import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const ScrollStorySection = dynamic(() => import("@/components/marketing/ScrollStorySection"), {
  loading: () => <div className="min-h-[28rem]" aria-hidden />,
});

const PlatformFlowSection = dynamic(() => import("@/components/marketing/PlatformFlowSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const RolesGridSection = dynamic(() => import("@/components/marketing/RolesGridSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <HeroSection />
      <ScrollStorySection />
      <AccentStripe />
      <ProductFeatureBand />
      <StatsBand />
      <WhatsNewSection />
      <PlatformFlowSection />
      <RolesGridSection />

      <section className={`owkin-cta-band ${sectionTight} text-center`} data-cta-band data-section="10">
        <div className={`${container} max-w-2xl`}>
          <h2 className="owkin-display owkin-cta-band__title mb-4 text-3xl md:text-4xl">
            Clinical work that stays under control.
          </h2>
          <p className="owkin-cta-band__lede mb-8 text-lg leading-relaxed md:text-xl">
            Capture consultations, coordinate care, and keep every decision attributed and auditable — across EMIS Web
            and SystmOne.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/get-started" className="owkin-cta-band__btn">
              Get started
            </Link>
            <Link href="/demo/script" className="owkin-cta-band__link">
              Book a demonstration
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
