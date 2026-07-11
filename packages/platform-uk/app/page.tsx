import type { Metadata } from "next";
import Link from "next/link";

import AgentGrid from "@/components/marketing/AgentGrid";
import Footer from "@/components/marketing/Footer";
import HeroSection from "@/components/marketing/HeroSection";
import HowItWorks from "@/components/marketing/HowItWorks";
import Navbar from "@/components/marketing/Navbar";
import ProblemSection from "@/components/marketing/ProblemSection";
import VoiceAgentSection from "@/components/marketing/VoiceAgentSection";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: "Aksh Health — Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <div className="marketing-site">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <AgentGrid />
      <VoiceAgentSection />

      <section className="bg-emerald py-24 text-center text-white">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-4xl font-bold">Join the Phase 1 ICS Pilot — October 2026</h2>
          <p className="mb-8 text-xl text-white/80">
            3 NHS ICS sites · 150 clinicians · 5,000 patients · EMIS Web and SystmOne
          </p>
          <Link
            href="/pilot/apply"
            className="inline-block rounded-xl bg-white px-10 py-4 text-lg font-bold text-emerald shadow-lg transition-colors hover:bg-white/90"
          >
            Apply for Pilot Cohort
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
