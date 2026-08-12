import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformPageContent } from "@/components/marketing/platform-page-content";

export const metadata: Metadata = {
  title: "Platform ",
  description:
    "One platform, eight roles, clinician-owned care. Designed for EMIS Web and SystmOne via FHIR standards with human-in-the-loop review.",
};

export default function PlatformPage() {
  return (
    <MarketingShell editorial>
      <PlatformPageContent />
    </MarketingShell>
  );
}
