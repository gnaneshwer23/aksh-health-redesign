import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import ProductFeatureBand from "@/components/marketing/ProductFeatureBand";
import StatsBand from "@/components/marketing/StatsBand";
import { container, sectionTight } from "@/components/marketing/marketing-ui";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const WhatsNewSection = dynamic(() => import("@/components/marketing/WhatsNewSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const PlatformFlowSection = dynamic(() => import("@/components/marketing/PlatformFlowSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const RolesGridSection = dynamic(() => import("@/components/marketing/RolesGridSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Diabetes care coordination with human review",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <HeroSection />
      <StatsBand />
      <ProductFeatureBand />
      <WhatsNewSection />
      <RolesGridSection />
      <PlatformFlowSection />

      <section className={`owkin-cta-band ${sectionTight} text-center`} data-cta-band data-section="10">
        <div className={`${container} max-w-xl`}>
          <h2 className="owkin-display owkin-cta-band__title mb-4 text-3xl md:text-4xl">
            Diabetes care that stays under control.
          </h2>
          <p className="owkin-cta-band__lede mb-8 text-base leading-relaxed md:text-lg">
            One review queue. Named clinician approval. Sits beside your existing EHR — no automatic write-back.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/get-started" className="owkin-cta-band__btn">
              Request access
            </Link>
            <Link href="/contact" className="owkin-cta-band__link">
              Contact
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
