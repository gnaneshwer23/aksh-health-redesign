import Link from "next/link"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"

export default function PilotPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16">
        <div className="text-center max-w-2xl px-6" data-legacy-scaffold>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-4">
            Legacy package · not the live site
          </p>
          <h1 className="text-4xl font-bold text-navy mb-4">Pilot CTAs here are outdated</h1>
          <p className="text-steel text-lg mb-8">
            This scaffold previously advertised an October 2026 ICS pilot with fixed site counts.
            That is not current product status. Request organisational pilots on the live site.
          </p>
          <Link
            href="https://www.akshhealth.com/get-started"
            className="inline-block px-10 py-4 bg-emerald text-white font-bold rounded-xl hover:bg-emerald/90 transition-colors text-lg shadow-lg"
          >
            Request a pilot on www.akshhealth.com
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
