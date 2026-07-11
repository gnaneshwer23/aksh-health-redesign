import type { Metadata } from "next";

import { AudiencePage } from "@/components/marketing/AudienceHero";
import { PlatformCliniciansPanel } from "@/components/marketing/platform-tab-panels";

export const metadata: Metadata = {
  title: "For Clinicians | Aksh Health",
  description:
    "Review-first clinical workflow for UK GPs and nurses. Structured drafts, safety checks, and explicit approval before any record write-back.",
};

export default function ForCliniciansPage() {
  return (
    <AudiencePage
      kicker="For clinicians"
      title="Spend time with patients, not paperwork."
      description="Aksh Health gives GPs and nurses a clinical copilot in a synthetic-safe proof environment. It drafts notes, checks safety, and coordinates care. You approve every output before it reaches the record."
      ctaHref="/dashboard/gp"
      ctaLabel="Open clinician dashboard"
    >
      <PlatformCliniciansPanel />
    </AudiencePage>
  );
}
