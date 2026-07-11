import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For ICS | Aksh Health",
  description:
    "Population health intelligence for ICS leads and clinical informatics. Equity metrics, practice benchmarking, and admission forecasting across integrated care.",
};

export default function ForIcsPage() {
  return (
    <AudiencePageLayout
      eyebrow="For ICS"
      headline="See population health across your integrated care system."
      subline="ICS leads and clinical informatics teams get equity metrics, practice benchmarking, and admission forecasts across connected primary and secondary care. Synthetic cohorts in this build."
      roles={["ICS Lead", "Clinical Informatics", "Population Health"]}
      pains={[
        {
          title: "Uneven practice performance",
          body: "AI adoption, queue clearance, and safety outcomes vary widely across practices with no shared scorecard.",
        },
        {
          title: "Equity gaps hard to quantify",
          body: "Health disparities by deprivation and ethnicity are difficult to surface consistently across the ICS footprint.",
        },
        {
          title: "Reactive system planning",
          body: "Admission pressure and winter demand are managed practice by practice instead of from an ICS-wide forecast.",
        },
      ]}
      features={[
        {
          title: "Population health dashboards",
          body: "Risk distribution and deprivation-linked condition prevalence across practices in your ICS, powered by the clinical knowledge graph.",
        },
        {
          title: "EQUITY intelligence",
          body: "Health disparity flags by IMD quintile and ethnicity with recommended actions and monthly equity reporting.",
        },
        {
          title: "Practice benchmarking",
          body: "Sortable practice scorecards for AI adoption, review queue clearance, and overall performance across your footprint.",
        },
      ]}
      previewTitle="ICS population intelligence"
      previewDescription="Population charts, equity deep-dives, and 14-day admission forecasts for integrated care leads. Synthetic data in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=ics-lead" }}
      ctaSecondary={{ label: "Organisation enquiry", href: "/get-started" }}
      complianceNote="Aggregate views only by default. Individual patient access requires explicit governance approval. See documentation for data access pathways."
    />
  );
}
