import Link from "next/link";

import TrustStrip from "@/components/marketing/TrustStrip";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-medicom-navy">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:60px_60px] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(0_168_107/0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgb(0_61_122/0.35),transparent_40%)]" />

      <div className="relative mx-auto flex flex-1 flex-col items-center justify-center px-6 pb-32 pt-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 shadow-sm backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm font-medium text-white/90">AI-native Healthcare OS for the NHS</span>
        </div>

        <h1 className="mb-5 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Clinical workflows,
          <span className="block text-white/95">one platform.</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
          Designed for EMIS Web and SystmOne with FHIR R4 ready integration paths. Specialist AI agents draft notes,
          check safety, and coordinate care. Every output needs clinician approval before it reaches the record.
          Demo uses synthetic data.
        </p>

        <div className="mb-12 flex w-full max-w-xl flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <Link
            href="/signup"
            className="rounded-xl bg-emerald px-7 py-3.5 text-base font-bold text-white shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[10.5rem]"
          >
            Get Started
          </Link>
          <Link
            href="/demo"
            className="rounded-xl border-2 border-white/80 bg-transparent px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:min-w-[10.5rem]"
          >
            See it in action
          </Link>
          <Link
            href="/get-started"
            className="px-4 py-3.5 text-base font-semibold text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline sm:min-w-0"
          >
            Book a demo
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {[
            "NHS DCB0129 pathway",
            "FHIR R4 ready",
            "Human-in-the-Loop",
            "NHS CIS2 ready",
            "DTAC aligned",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 backdrop-blur-sm sm:text-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <div className="bg-gradient-to-b from-transparent via-medicom-navy/80 to-medicom-surface/90 pt-8">
          <TrustStrip variant="hero" />
        </div>
      </div>
    </section>
  );
}
