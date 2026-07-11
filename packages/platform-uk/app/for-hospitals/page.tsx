import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Hospitals | Aksh Health",
  description:
    "Hospital command centre for executives and operational leads. Ward capacity, staffing intelligence, and admission forecasting with clinician approval on every output.",
};

export default function ForHospitalsPage() {
  return <AudiencePageLayout {...audiencePages.hospitals} />;
}
