import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformPageContent } from "@/components/marketing/platform-page-content";

export const metadata: Metadata = {
  title: "Platform | Aksh Health",
  description:
    "One platform, eight roles, clinician-owned AI. Designed for EMIS Web and SystmOne via FHIR R4 staging with human-in-the-loop review (liveEmis:false).",
};

export default function PlatformPage() {
  return (
    <MarketingShell editorial>
      <PlatformPageContent />
    </MarketingShell>
  );
}
