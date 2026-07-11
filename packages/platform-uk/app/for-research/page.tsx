import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Research | Aksh Health",
  description:
    "Clinical informatics and outcome research for NHS analysts. Cohort evaluation, governance boundaries, and authenticated data export with synthetic-safe defaults.",
};

export default function ForResearchPage() {
  return <AudiencePageLayout {...audiencePages.research} />;
}
