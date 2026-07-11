import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Research | Aksh Health",
  description:
    "Clinical informatics and outcome research for NHS analysts. Cohort evaluation, governance boundaries, and authenticated data export with synthetic-safe defaults.",
};

export default function ForResearchPage() {
  return (
    <AudiencePageLayout
      eyebrow="For research"
      headline="Evaluate outcomes with governed data access."
      subline="Researchers and clinical informatics analysts study cohort metrics, AI-assisted care outcomes, and safety signals with clear governance boundaries. Pseudonymised synthetic cohorts in this build."
      roles={["Researcher", "Clinical Informatics", "Health Economist"]}
      pains={[
        {
          title: "Fragmented evaluation data",
          body: "Outcome metrics for AI-assisted workflows sit across EHR exports, spreadsheets, and ad hoc queries with no consistent cohort view.",
        },
        {
          title: "Unclear access boundaries",
          body: "Ethics approvals and data access levels are hard to enforce when research tools bypass platform governance.",
        },
        {
          title: "Slow export cycles",
          body: "Getting authenticated evaluation exports for board papers or publication often means manual IT requests and delayed turnaround.",
        },
      ]}
      features={[
        {
          title: "Cohort evaluation dashboards",
          body: "Outcome metrics, evaluation charts, and study-level KPIs for AI-assisted care pathways across defined patient cohorts.",
        },
        {
          title: "Governed data access",
          body: "Aggregate access by default with explicit ethics reference tracking. Individual-level access requires governance sign-off.",
        },
        {
          title: "Authenticated export",
          body: "Download evaluation summaries as JSON authenticated to your researcher session for reproducible analysis workflows.",
        },
      ]}
      previewTitle="Research cohort overview"
      previewDescription="Cohort metrics, evaluation charts, and data access controls for clinical informatics research. Synthetic patients only in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=researcher" }}
      ctaSecondary={{ label: "Organisation enquiry", href: "/get-started" }}
      complianceNote="All cohort metrics in this build use pseudonymised synthetic patients. Production research access requires ethics approval and governance sign-off."
    />
  );
}
