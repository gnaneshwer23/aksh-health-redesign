import Link from "next/link"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

export default function PilotPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16">
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-4xl font-bold text-navy mb-4">ICS Pilot — October 2026</h1>
          <p className="text-steel text-lg mb-8">
            3 NHS ICS sites · 150 clinicians · 5,000 patients · EMIS Web and SystmOne
          </p>
          <Link
            href="/pilot/apply"
            className="inline-block px-10 py-4 bg-emerald text-white font-bold rounded-xl hover:bg-emerald/90 transition-colors text-lg shadow-lg"
          >
            Apply for Pilot Cohort
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
