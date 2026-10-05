import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import StatsBand from "@/components/marketing/StatsBand";
import ProductFeatureBand from "@/components/marketing/ProductFeatureBand";
import ProblemWorkflowSection from "@/components/marketing/ProblemWorkflowSection";
import ClinicalControlSection from "@/components/marketing/ClinicalControlSection";
import { container, sectionTight } from "@/components/marketing/marketing-ui";

const WhatsNewSection = dynamic(() => import("@/components/marketing/WhatsNewSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const IntelligenceLayerSection = dynamic(() => import("@/components/marketing/IntelligenceLayerSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const PatelJourneySection = dynamic(() => import("@/components/marketing/PatelJourneySection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const RolesGridSection = dynamic(() => import("@/components/marketing/RolesGridSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const InteropHonestySection = dynamic(() => import("@/components/marketing/InteropHonestySection"), {
  loading: () => <div className="min-h-[12rem]" aria-hidden />,
});

const SafetyTrustSection = dynamic(() => import("@/components/marketing/SafetyTrustSection"), {
  loading: () => <div className="min-h-[16rem]" aria-hidden />,
});

const PlatformFlowSection = dynamic(() => import("@/components/marketing/PlatformFlowSection"), {
  loading: () => <div className="min-h-[12rem]" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Clinical Intelligence, Under Clinical Control",
  description:
    "Aksh Health helps clinical teams capture, understand, review and coordinate care with AI-assisted intelligence and named clinician oversight. Diabetes-first. Primary-care ready.",
};

export default function HomePage() {
  return (
    <MarketingShell overLightHero>
      <HeroSection />
      <ProblemWorkflowSection />
      <StatsBand />
      <ClinicalControlSection />
      <ProductFeatureBand />
      <WhatsNewSection />
      <IntelligenceLayerSection />
      <PatelJourneySection />
      <RolesGridSection />
      <InteropHonestySection />
      <SafetyTrustSection />
      <PlatformFlowSection />

      <section className={`owkin-cta-band aksh-cta-med ${sectionTight} text-center`} data-cta-band data-section="14">
        <div className={`${container} max-w-2xl`}>
          <p className="owkin-roles__eyebrow mb-3">Start with a controlled use case</p>
          <h2 className="owkin-display owkin-cta-band__title mb-4 text-3xl md:text-4xl">
            Clinical intelligence should help clinicians think, not replace them.
          </h2>
          <p className="owkin-cta-band__lede mb-8 text-base leading-relaxed md:text-lg">
            Start with a focused workflow. Define the governance boundaries. Measure the outcomes. Expand when the
            evidence supports it. Diabetes care, properly coordinated — beside your EHR, not instead of it.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/get-started" className="owkin-cta-band__btn">
              Request a Pilot
            </Link>
            <Link href="/demo/patel" className="aksh-btn-soft aksh-btn-soft--on-light">
              Open the Patel Walkthrough
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
