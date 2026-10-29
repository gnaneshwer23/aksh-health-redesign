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

      {/* Legacy scaffold notice — this package is not production */}
      <section className="py-24 bg-slate-800 text-white text-center" data-legacy-scaffold>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 mb-4">Legacy package · not the live site</p>
          <h2 className="text-3xl font-bold mb-4">This marketing scaffold is retired.</h2>
          <p className="text-white/80 text-lg mb-8">
            Historical ICS pilot CTAs here are outdated. The live product is www.akshhealth.com
            (packages/platform-uk). Do not deploy this package.
          </p>
          <Link
            href="https://www.akshhealth.com"
            className="inline-block px-10 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-white/90 transition-colors text-lg shadow-lg"
          >
            Go to the live site
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
