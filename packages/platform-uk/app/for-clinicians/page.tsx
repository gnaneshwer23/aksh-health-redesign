import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Clinicians | Aksh Health",
  description:
    "Clinical copilot for GPs, nurses, and pharmacists. FHIR R4 staging documentation, safety checks, and a single review queue.",
};

export default function ForCliniciansPage() {
  return <AudiencePageLayout {...audiencePages.clinicians} />;
}
