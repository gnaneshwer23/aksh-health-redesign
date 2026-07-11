import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Administrators | Aksh Health",
  description:
    "System and integration administration for NHS care settings. FHIR pipeline health, multi-tenant configuration, and SHIELD audit infrastructure.",
};

export default function ForAdministratorsPage() {
  return (
    <AudiencePageLayout
      eyebrow="For administrators"
      headline="Keep integrations healthy and governance auditable."
      subline="System administrators and clinical informatics leads monitor FHIR pipelines, tenancy boundaries, and SHIELD evidence across connected organisations. Designed for EMIS Web, SystmOne, and Mirth environments. Synthetic data in this build."
      roles={["System Administrator", "Clinical Informatics", "Integration Lead"]}
      pains={[
        {
          title: "Opaque integration status",
          body: "EMIS feeds, Mirth channels, and FHIR pipelines fail quietly until clinicians report missing data in the record.",
        },
        {
          title: "Tenancy sprawl across sites",
          body: "Configuring roles, sites, and access boundaries across multiple organisations needs consistent technical controls.",
        },
        {
          title: "Audit evidence assembled late",
          body: "DSPT and clinical safety reviews need immutable trails of AI recommendations and administrator actions, not retrospective exports.",
        },
      ]}
      features={[
        {
          title: "Integration health monitoring",
          body: "Track EMIS, Mirth, and FHIR R4 ready pipeline status from a single admin view. Production interoperability is on the roadmap.",
        },
        {
          title: "Multi-tenant configuration",
          body: "Manage organisation boundaries, role mappings, and access policies across practices and connected systems.",
        },
        {
          title: "SHIELD audit infrastructure",
          body: "Immutable audit trail for AI recommendations and administrator actions. Governance scaffolding for compliance reviews.",
        },
      ]}
      previewTitle="Admin dashboard for system operations"
      previewDescription="Integration health, tenant configuration, and SHIELD compliance views for technical administrators. Synthetic data in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=practice-manager" }}
      ctaSecondary={{ label: "Organisation enquiry", href: "/get-started" }}
      complianceNote="Compliance badges describe aligned design pathways, not certification. See documentation for architecture and compliance pathways."
    />
  );
}
