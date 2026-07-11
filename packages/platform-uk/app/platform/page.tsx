import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformPageContent } from "@/components/marketing/platform-page-content";

export const metadata: Metadata = {
  title: "Platform | Aksh Health",
  description:
    "One platform, eight roles, clinician-owned AI. FHIR R4 ready workflows for EMIS Web and SystmOne with human-in-the-loop review. Demo uses synthetic data.",
};

export default function PlatformPage() {
  return (
    <MarketingShell overDarkHero>
      <PlatformPageContent />
    </MarketingShell>
  );
}
