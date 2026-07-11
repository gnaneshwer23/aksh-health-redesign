import type { Metadata } from "next";
import Link from "next/link";

import { HowItWorksPageContent } from "@/components/marketing/HowItWorksPageContent";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `How it works | ${SEO_DEFAULTS.title}`,
  description:
    "See how Aksh Health connects EMIS Web and SystmOne to a Neo4j knowledge graph, twelve AI agents, human review, and governed FHIR write-back.",
};

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-light via-white to-white">
        <div
          className="marketing-hero-blob marketing-hero-blob--emerald absolute -right-24 top-0 h-[24rem] w-[24rem] opacity-[0.12]"
          aria-hidden
        />
        <div
          className="marketing-hero-blob marketing-hero-blob--navy absolute -left-28 top-16 h-[22rem] w-[22rem] opacity-[0.08]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-24 lg:px-8 lg:py-28">
          <p className="marketing-section-label mb-4">How it works</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-navy md:text-5xl">
            From fragmented data to coordinated care
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-steel">
            Aksh Healthcare OS connects your EHR, builds a patient knowledge graph, runs twelve specialist agents in
            parallel, and routes every output through clinician review before it reaches the record.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/get-started"
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-emerald/20 transition-all hover:-translate-y-0.5 hover:bg-emerald/90 sm:min-w-[11rem]"
            >
              Request organisation access
            </Link>
            <Link
              href="/platform"
              className="rounded-xl border border-navy/25 bg-white px-8 py-3.5 text-center text-base font-medium text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/40 hover:bg-navy/[0.03] sm:min-w-[11rem]"
            >
              Explore platform
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <HowItWorksPageContent />

      <section className="bg-emerald py-16 text-center text-white md:py-20">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to see it in your organisation?</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Eight role-specific dashboards. FHIR R4 ready for EMIS Web and SystmOne. Clinical safety built in from day
            one.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="inline-block min-w-[11rem] rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-emerald shadow-lg transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Request organisation access
            </Link>
            <Link
              href="/signup"
              className="inline-block min-w-[11rem] rounded-xl border border-white/40 px-8 py-3.5 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
