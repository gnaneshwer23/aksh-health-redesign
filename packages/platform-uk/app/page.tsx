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
  title: "Aksh Health | Healthcare OS",
  description: SEO_DEFAULTS.description,
};

export default function HomePage() {
  return (
    <div className="marketing-site overflow-x-hidden">
      <Navbar />
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
              href="/get-started"
              className="inline-block rounded-full border-2 border-white/80 px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
