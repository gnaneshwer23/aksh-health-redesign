import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Practices | Aksh Health",
  description:
    "Practice management and admin operations for NHS primary care. Tenancy, integration health, and SHIELD audit views. FHIR R4 ready design.",
};

export default function ForPracticesPage() {
  return (
    <AudiencePageLayout
      eyebrow="For practices"
      headline="Run the practice with clear oversight."
      subline="Practice managers and administrators get tenancy controls, integration health views, and compliance evidence scaffolding. Designed for EMIS Web and SystmOne environments. Demo uses synthetic data."
      roles={["Practice Manager", "Practice Administrator"]}
      pains={[
        {
          title: "Limited integration visibility",
          body: "It is hard to see whether EHR feeds, FHIR pipelines, and third-party tools are healthy across the practice.",
        },
        {
          title: "Role and access sprawl",
          body: "Onboarding clinicians, nurses, and admin staff across multiple sites needs consistent tenancy and permissions.",
        },
        {
          title: "Compliance evidence gaps",
          body: "CQC, DSPT, and clinical safety audits need immutable trails, not spreadsheets assembled after the fact.",
        },
      ]}
      features={[
        {
          title: "Practice-level tenancy",
          body: "Configure sites, roles, and access boundaries for your organisation. Multi-site scaffolding for growing practices.",
        },
        {
          title: "Integration health",
          body: "Monitor EMIS and Mirth integration status with FHIR R4 ready pathways. Production interoperability is on the roadmap.",
        },
        {
          title: "SHIELD audit views",
          body: "Immutable audit trail for AI recommendations and clinician actions. Governance dashboards for practice leadership.",
        },
      ]}
      previewTitle="Admin dashboard for practice operations"
      previewDescription="Integration health, tenant configuration, and SHIELD compliance views for practice administrators. Synthetic data in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=practice-manager" }}
      ctaSecondary={{ label: "Organisation enquiry", href: "/get-started" }}
      complianceNote="Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways."
    />
  );
}
