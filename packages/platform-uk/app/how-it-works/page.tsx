import type { Metadata } from "next";
import Link from "next/link";

import { HowItWorksPageContent } from "@/components/marketing/HowItWorksPageContent";
import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformFlowDiagram } from "@/components/marketing/PlatformFlowDiagram";
import TrustStrip from "@/components/marketing/TrustStrip";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `How it works | ${SEO_DEFAULTS.title}`,
  description:
    "See how Aksh Health connects EMIS Web and SystmOne to a Neo4j knowledge graph, eight AI agents, human review, and governed FHIR write-back.",
};

export default function HowItWorksPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="How it works"
        title="How Aksh Health works"
        lede="From EHR intake to governed write-back: one connected pipeline with eight specialist agents and clinician approval on every output. This page owns the depth — the homepage only introduces the story."
        primary={{ label: "Create account", href: "/signup" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
        aside={
          <>
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate/55">
              Platform pipeline preview
            </p>
            <PlatformFlowDiagram variant="compact" showDescriptions={false} />
          </>
        }
      />

      <TrustStrip />

      <HowItWorksPageContent />

      <MarketingCtaBand
        title="Ready to see it in your organisation?"
        lede="Eight role-specific dashboards. FHIR R4 ready for EMIS Web and SystmOne. Clinical safety built in from day one."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Create account", href: "/signup" }}
      />

      <div className="pb-8 text-center text-sm text-slate/65">
        Questions first?{" "}
        <Link href="/faq" className="font-medium text-navy-dark underline-offset-4 hover:underline">
          Read the FAQ
        </Link>
      </div>
    </MarketingShell>
  );
}
