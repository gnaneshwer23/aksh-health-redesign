import type { Metadata } from "next";
import Link from "next/link";

import { HowItWorksPageContent } from "@/components/marketing/HowItWorksPageContent";
import {
  bandPrimaryCta,
  bandSecondaryCta,
  container,
  heroPrimaryCta,
  heroSecondaryCta,
} from "@/components/marketing/marketing-ui";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";
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

        <div className={`relative ${container} py-20 md:py-24 lg:py-28`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <p className="marketing-section-label mb-4">How it works</p>
              <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-navy sm:text-5xl">
                How Aksh Health works
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-steel sm:text-lg">
                From EHR intake to governed write-back: one connected pipeline with twelve specialist agents and
                clinician approval on every output.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/signup" className={`${heroPrimaryCta} sm:min-w-[11rem]`}>
                  Create account
                </Link>
                <Link href="/get-started" className={`${heroSecondaryCta} sm:min-w-[11rem]`}>
                  Request organisation access
                </Link>
              </div>
            </div>

            <div className="marketing-glass-card p-6 md:p-8">
              <p className="mb-5 text-center text-xs font-semibold uppercase tracking-wider text-steel">
                Platform pipeline preview
              </p>
              <PlatformFlowDiagram variant="compact" showDescriptions={false} />
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-border-subtle bg-white">
        <TrustStrip />
      </div>

      <HowItWorksPageContent />

      <section className="marketing-section-tight bg-emerald text-center text-white">
        <div className={`${container} max-w-2xl`}>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to see it in your organisation?</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/80">
            Eight role-specific dashboards. FHIR R4 ready for EMIS Web and SystmOne. Clinical safety built in from day
            one.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className={`${bandPrimaryCta} min-w-[11rem]`}>
              Request organisation access
            </Link>
            <Link href="/signup" className={`${bandSecondaryCta} min-w-[11rem]`}>
              Create account
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
