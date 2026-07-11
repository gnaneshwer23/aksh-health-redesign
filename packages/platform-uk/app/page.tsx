import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
import StatsBand from "@/components/marketing/StatsBand";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

const ProblemSection = dynamic(() => import("@/components/marketing/ProblemSection"), {
  loading: () => <div className="min-h-[20rem] bg-white" aria-hidden />,
});

const HowItWorks = dynamic(() => import("@/components/marketing/HowItWorks"), {
  loading: () => <div className="min-h-[20rem] bg-surface" aria-hidden />,
});

const AgentGrid = dynamic(() => import("@/components/marketing/AgentGrid"), {
  loading: () => <div className="min-h-[24rem] bg-white" aria-hidden />,
});

const VoiceAgentSection = dynamic(() => import("@/components/marketing/VoiceAgentSection"), {
  loading: () => <div className="min-h-[24rem] bg-navy-dark" aria-hidden />,
});

export const metadata: Metadata = {
  title: "Aksh Health | Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <MarketingShell overDarkHero className="overflow-x-hidden">
      <HeroSection />
      <StatsBand />
      <ProblemSection />
      <HowItWorks />
      <AgentGrid />
      <VoiceAgentSection />

      <section className="bg-emerald py-20 text-center text-white md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Ready to deploy across your organisation?
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/85 md:text-xl">
            Eight role-specific dashboards. FHIR R4 ready, designed for EMIS Web and SystmOne. Clinical safety built
            in from day one. Demo uses synthetic data.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-block min-w-[11rem] rounded-xl bg-white px-10 py-4 text-lg font-bold text-emerald shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Get Started
            </Link>
            <Link
              href="/demo/patel"
              className="inline-block min-w-[11rem] rounded-xl border-2 border-white/80 px-10 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              See it in action
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
