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
  title: `Workflow | ${SEO_DEFAULTS.title}`,
  description:
    "How Aksh Health works: capture → draft → clinician approve, audit trails, and FHIR exchange across EMIS Web and SystmOne pathways.",
};

export default function HowItWorksPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Workflow"
        title="How Aksh Health works"
        lede="Supporting intelligence. One clinician review gate. Capture → draft → approve, then exchange using FHIR standards — clinicians remain responsible for every approved outcome."
        primary={{ label: "Book demonstration", href: "/how-it-works#two-minute-script" }}
        secondary={{ label: "View workflow", href: "/how-it-works#pipeline" }}
        aside={
          <>
            <p className="mb-4 text-center text-xs font-semibold tracking-wide text-slate/55">
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
        lede="Role-specific workspaces, clinician review, audit trails, and FHIR exchange — designed for NHS organisations."
        primary={{ label: "Book demonstration", href: "/demo/script" }}
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
