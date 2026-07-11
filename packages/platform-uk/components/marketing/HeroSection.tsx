import Link from "next/link";

import TrustStrip from "@/components/marketing/TrustStrip";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-medicom-navy">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:60px_60px] opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(0_168_107/0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgb(0_61_122/0.35),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 shadow-sm backdrop-blur-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm font-medium text-white/85">AI-native Healthcare OS for the NHS</span>
        </div>

        <h1 className="mb-4 text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
          Clinical workflows, one platform.
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-white/75">
          Designed for EMIS Web and SystmOne with FHIR R4 ready integration paths. Specialist AI agents draft notes,
          check safety, and coordinate care. Every output needs clinician approval before it reaches the record.
          Demo uses synthetic data.
        </p>

        <div className="mb-14 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="rounded-2xl bg-emerald px-8 py-4 text-lg font-bold text-white shadow-card-hover transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
          >
            Get Started
          </Link>
          <Link
            href="/get-started"
            className="rounded-2xl border-2 border-white/80 px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            Book a Demo
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {[
            "NHS DCB0129 pathway",
            "FHIR R4 ready",
            "Human-in-the-Loop",
            "NHS CIS2 ready",
            "DTAC aligned",
          ].map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/80 backdrop-blur-sm"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10">
        <TrustStrip />
        <div className="h-16 bg-gradient-to-t from-medicom-surface to-transparent" />
      </div>
    </section>
  );
}
