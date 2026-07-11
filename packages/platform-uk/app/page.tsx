import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import HeroSection from "@/components/marketing/HeroSection";
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
      <ProblemSection />
      <HowItWorks />
      <AgentGrid />
      <VoiceAgentSection />

      <section className="bg-emerald py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-4xl font-bold">Ready to deploy across your organisation?</h2>
          <p className="mb-8 text-xl text-white/80">
            Eight role-specific dashboards. FHIR R4 ready, designed for EMIS Web and SystmOne. Clinical safety built in from day one. Demo uses synthetic data.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-block rounded-full bg-white px-10 py-4 text-lg font-bold text-emerald shadow-lg transition-colors hover:bg-white/90"
            >
              Create your account
            </Link>
            <Link
              href="/demo/patel"
              className="inline-block rounded-full border-2 border-white/80 px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
            >
              See it in action
            </Link>
            <Link
              href="/get-started"
              className="inline-block rounded-full border border-white/50 px-10 py-4 text-lg font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
