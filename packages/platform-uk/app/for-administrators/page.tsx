import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Administrators | Aksh Health",
  description:
    "System and integration administration for NHS care settings. FHIR pipeline health, multi-tenant configuration, and SHIELD audit infrastructure.",
};

export default function ForAdministratorsPage() {
  return <AudiencePageLayout {...audiencePages.administrators} />;
}
