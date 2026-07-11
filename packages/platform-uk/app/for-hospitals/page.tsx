import type { Metadata } from "next";

import { AudiencePageLayout } from "@/components/marketing/audience-page-layout";

export const metadata: Metadata = {
  title: "For Hospitals | Aksh Health",
  description:
    "Hospital command centre for executives and operational leads. Ward capacity, staffing intelligence, and admission forecasting with clinician approval on every output.",
};

export default function ForHospitalsPage() {
  return (
    <AudiencePageLayout
      eyebrow="For hospitals"
      headline="Command your hospital, not just your dashboard."
      subline="Aksh Health gives hospital executives and operational leads a single view across wards, emergency demand, and workforce pressure. Designed for Epic, Oracle Health, and NHS Spine-connected environments. Synthetic data in this build."
      roles={["Hospital Executive", "Medical Director", "Chief Operating Officer"]}
      pains={[
        {
          title: "Fragmented operational data",
          body: "ED waits, bed occupancy, and staffing gaps sit in separate systems with no unified command view for trust leadership.",
        },
        {
          title: "Reactive capacity planning",
          body: "Winter surges and elective backlogs are managed after pressure arrives, not when forecasts show demand building.",
        },
        {
          title: "Workforce pressure without foresight",
          body: "Agency triggers and theatre utilisation are hard to align when ED demand shifts faster than rota planning cycles.",
        },
      ]}
      features={[
        {
          title: "Hospital command centre",
          body: "Real-time ED waiting times, bed occupancy, staff shortage alerts, and AI recommendations in one operational view for your trust.",
        },
        {
          title: "Capacity prediction",
          body: "Admission forecasts and winter planning powered by the Capacity Prediction agent. Know bed demand up to 14 days ahead.",
        },
        {
          title: "Workforce intelligence",
          body: "Agency staff triggers, theatre utilisation optimisation, and elective scheduling aligned to ED demand patterns.",
        },
      ]}
      previewTitle="Command centre for trust operations"
      previewDescription="Ward status, capacity forecasts, and staffing ratios for hospital executives. Synthetic patients only in this build."
      ctaPrimary={{ label: "Create account", href: "/signup?role=hospital-executive" }}
      ctaSecondary={{ label: "Executive briefing", href: "/get-started" }}
      complianceNote="Immutable audit trail and ICS-level governance dashboards for medical directors and CIOs. See documentation for architecture and compliance pathways."
    />
  );
}
