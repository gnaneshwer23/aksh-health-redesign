import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-navy-dark">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm font-medium text-white/80">NHS Phase 1 Pilot — October 2026</span>
        </div>

        <h1 className="mb-4 text-5xl font-bold leading-tight text-white md:text-7xl">Healthcare Has Data.</h1>
        <h1 className="mb-8 text-5xl font-bold leading-tight text-emerald md:text-7xl">Now It Has Intelligence.</h1>

        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-white/70">
          Aksh Health connects your existing EHR systems — EMIS, SystmOne, Epic — to a network of AI agents
          that coordinate care, predict deterioration, and eliminate administrative waste. Every output requires
          human approval.
        </p>

        <div className="mb-14 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/pilot"
            className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-navy shadow-lg transition-colors hover:bg-white/90"
          >
            Request a Pilot
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-xl border-2 border-emerald px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-emerald/20"
          >
            See How It Works
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            "NHS DCB0129 Compliant",
            "HL7 FHIR R4 Native",
            "Human-in-the-Loop",
            "NHS CIS2 SSO",
            "DTAC Aligned",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
    </section>
  );
}
