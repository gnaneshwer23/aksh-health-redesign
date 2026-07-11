import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Clinicians | Aksh Health",
  description:
    "Clinical copilot for GPs, nurses, and pharmacists. FHIR R4 ready documentation, safety checks, and a single review queue. Demo uses synthetic data.",
};

export default function ForCliniciansPage() {
  return (
    <AudiencePageLayout
      eyebrow="For clinicians"
      headline="Spend time with patients, not paperwork."
      subline="Aksh Health is designed for EMIS Web and SystmOne workflows. Specialist agents draft notes, check safety, and coordinate care. You approve every output before it reaches the record. Demo uses synthetic data."
      roles={["GP", "Nurse", "Pharmacist"]}
      pains={[
        {
          title: "Admin overload",
          body: "Clinicians spend too much time on documentation and referral coordination instead of direct patient care.",
        },
        {
          title: "Fragmented safety checks",
          body: "Drug interactions, allergies, and risk scores sit in separate systems with no unified review path.",
        },
        {
          title: "AI outputs without governance",
          body: "Generic AI tools produce documents that never reach the record or pass clinical safety review.",
        },
      ]}
      features={[
        {
          title: "Clinical copilot",
          body: "Pre-consultation briefing, in-consultation decision support, and post-consultation task management within your existing workflow.",
        },
        {
          title: "SYNTHESIS documentation",
          body: "Ambient note generation produces FHIR DocumentReference SOAP notes. You review, edit, and approve before anything is staged for the record.",
        },
        {
          title: "One review queue",
          body: "GUARDIAN safety checks, ORACLE risk scores, and referral drafts in one place. Accept, edit, or reject. Nothing proceeds without your approval.",
        },
      ]}
      previewTitle="Role dashboards for clinical teams"
      previewDescription="GP, nurse, and pharmacist views with review queue, vitals, handover, and medicines safety. Synthetic patients only in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=gp" }}
      ctaSecondary={{ label: "See it in action", href: "/demo/patel" }}
      complianceNote="Human-in-the-loop on every clinical output. NHS DCB0129 safety case in progress. See documentation for architecture and compliance pathways."
    />
  );
}
