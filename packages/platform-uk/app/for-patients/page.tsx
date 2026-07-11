import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Patients | Aksh Health",
  description:
    "Patient health companion for check-ins, medication support, and care plan visibility between appointments. Invited by your GP practice.",
};

export default function ForPatientsPage() {
  return (
    <AudiencePageLayout
      eyebrow="For patients"
      headline="Your health, understood and supported."
      subline="The Health Companion keeps you connected to your care team between appointments. Check-ins, reminders, and secure messaging with clinician oversight. Demo uses synthetic data."
      roles={["Patient"]}
      pains={[
        {
          title: "Gaps between appointments",
          body: "Symptoms change after you leave the surgery, but getting timely advice can mean long waits on the phone.",
        },
        {
          title: "Medication confusion",
          body: "Multiple medicines and changing doses are hard to track without simple reminders and plain-language guidance.",
        },
        {
          title: "Unclear care plans",
          body: "Upcoming tasks, referrals, and lifestyle goals are often buried in letters rather than one accessible view.",
        },
      ]}
      features={[
        {
          title: "Daily health check-ins",
          body: "Track symptoms and wellbeing between visits. Responses are reviewed by your care team when clinical action is needed.",
        },
        {
          title: "Medication support",
          body: "Reminders and adherence support tailored to your conditions, with escalation to clinicians when concerns arise.",
        },
        {
          title: "Care plan in plain English",
          body: "See upcoming tasks, appointments, and lifestyle coaching in one companion view. You control what the AI can access.",
        },
      ]}
      previewTitle="Health Companion preview"
      previewDescription="Patient-facing companion for check-ins, medications, and care plan visibility. Ask your GP practice if they use Aksh Health."
      ctaPrimary={{ label: "Create account", href: "/signup?role=patient" }}
      ctaSecondary={{ label: "Learn more", href: "/docs" }}
      complianceNote="Your data stays within your NHS care pathway. You can opt out of AI-assisted features at any time."
    />
  );
}
