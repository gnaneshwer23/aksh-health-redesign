import type { Metadata } from "next";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PlatformPageContent } from "@/components/marketing/platform-page-content";

export const metadata: Metadata = {
  title: "Platform ",
  description:
    "The Aksh Intelligence Platform: one auditable, human-in-the-loop intelligence layer beside your EHR. Twelve agents under one supervisor and audit trail, eight roles, FHIR R4 staging with a simulated EHR. First module: Aksh Diabetes.",
};

export default function PlatformPage() {
  return (
    <MarketingShell editorial>
      <PlatformPageContent />
    </MarketingShell>
  );
}
