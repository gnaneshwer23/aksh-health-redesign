import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience";
import { audiencePages } from "@/components/marketing/audience/audience-content";

export const metadata: Metadata = {
  title: "For Patients | Aksh Health",
  description:
    "Patient health companion for check-ins, medication support, and care plan visibility between appointments. Invited by your GP practice.",
};

export default function ForPatientsPage() {
  return <AudiencePageLayout {...audiencePages.patients} />;
}
