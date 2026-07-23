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
    "End-to-end Aksh Health pipeline: 12 agents, capture → draft → clinician approve, SHIELD audit, FHIR staging. Synthetic demo — no live EHR write-back.",
};

export default function HowItWorksPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="How it works"
        title="How Aksh Health works"
        lede="Twelve agents. One HITL gate. Capture → draft → clinician approve → FHIR staging. Synthetic demo data today — no live EMIS or SystmOne write-back (liveEmis:false)."
        primary={{ label: "Two-minute script", href: "/how-it-works#two-minute-script" }}
        secondary={{ label: "See the pipeline", href: "/how-it-works#pipeline" }}
        aside={
          <>
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate/55">
              Care journey preview
            </p>
            <PlatformFlowDiagram variant="journey" showDescriptions={false} />
          </>
        }
      />

      <TrustStrip />

      <HowItWorksPageContent />

      <MarketingCtaBand
        title="Ready to see it in your organisation?"
        lede="Role-specific dashboards, HITL review, SHIELD audit, and FHIR R4 staging. Live EHR write-back remains partner Phase 2 — liveEmis:false."
        primary={{ label: "Guided demo script", href: "/demo/script" }}
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
