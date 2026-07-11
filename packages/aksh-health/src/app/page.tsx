import Navbar from "@/components/marketing/Navbar"
import HeroSection from "@/components/marketing/HeroSection"
import ProblemSection from "@/components/marketing/ProblemSection"
import HowItWorks from "@/components/marketing/HowItWorks"
import AgentGrid from "@/components/marketing/AgentGrid"
import VoiceAgentSection from "@/components/marketing/VoiceAgentSection"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <HowItWorks />
      <AgentGrid />
      <VoiceAgentSection />

      {/* Pilot CTA Section */}
      <section className="py-24 bg-emerald text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">Join the Phase 1 ICS Pilot — October 2026</h2>
          <p className="text-white/80 text-xl mb-8">
            3 NHS ICS sites · 150 clinicians · 5,000 patients · EMIS Web and SystmOne
          </p>
          <Link
            href="/pilot/apply"
            className="inline-block px-10 py-4 bg-white text-emerald font-bold rounded-xl hover:bg-white/90 transition-colors text-lg shadow-lg"
          >
            Apply for Pilot Cohort
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
