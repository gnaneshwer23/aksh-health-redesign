import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For ICS | Aksh Health",
  description:
    "Population health intelligence for ICS leads and clinical informatics. Equity metrics, practice benchmarking, and admission forecasting across integrated care.",
};

export default function ForIcsPage() {
  return <AudiencePageLayout {...audiencePages.ics} />;
}
