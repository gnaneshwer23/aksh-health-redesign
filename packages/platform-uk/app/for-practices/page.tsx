import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Practices | Aksh Health",
  description:
    "Practice management and admin operations for NHS primary care. Tenancy, integration health, and SHIELD audit views. FHIR R4 ready design.",
};

export default function ForPracticesPage() {
  return <AudiencePageLayout {...audiencePages.practices} />;
}
