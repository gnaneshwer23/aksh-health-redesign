import Link from "next/link"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-navy-dark flex items-center overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-white/80 text-sm font-medium">Legacy scaffold · not production</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
          Healthcare Has Data.
        </h1>
        <h1 className="text-5xl md:text-7xl font-bold text-emerald leading-tight mb-8">
          Now It Has Intelligence.
        </h1>

        {/* Sub */}
        <p className="max-w-2xl mx-auto text-white/70 text-xl leading-relaxed mb-10">
          Aksh Health connects your existing EHR systems — EMIS, SystmOne, Epic — to a network of
          AI agents that coordinate care, predict deterioration, and eliminate administrative waste.
          Every output requires human approval.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <Link
            href="https://www.akshhealth.com"
            className="px-8 py-4 bg-white text-navy font-bold rounded-xl hover:bg-white/90 transition-colors text-lg shadow-lg"
          >
            Live site (www.akshhealth.com)
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 border-2 border-emerald text-white font-bold rounded-xl hover:bg-emerald/20 transition-colors text-lg"
          >
            See How It Works
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            "NHS DCB0129 Compliant",
            "HL7 FHIR R4 Native",
            "Human-in-the-Loop",
            "NHS CIS2 SSO",
            "DTAC Aligned",
          ].map((badge) => (
            <span
              key={badge}
              className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
    </section>
  )
}
