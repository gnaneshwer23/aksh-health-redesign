import type { Metadata } from "next";

import { AudiencePage } from "@/components/marketing/AudienceHero";

export const metadata: Metadata = {
  title: "For Hospitals",
  description: "Hospital Command Centre, capacity prediction, digital twin, and workforce intelligence for NHS trusts and private providers.",
};

const sections = [
  {
    title: "Hospital Command Centre",
    body: "Real-time ED waiting times, bed occupancy, staff shortage alerts, and AI recommendations — a single operational view for your trust.",
  },
  {
    title: "Capacity Prediction",
    body: "Know your bed demand 14 days before it happens. Admission forecasts and winter planning powered by the Capacity Prediction agent.",
  },
  {
    title: "Digital Twin",
    body: "Simulate winter surge scenarios. Model what happens if ED admissions rise 20% and get AI recommendations 72 hours in advance.",
  },
  {
    title: "Workforce Intelligence",
    body: "Agency staff triggers, theatre utilisation optimisation, and elective capacity scheduling around ED demand.",
  },
  {
    title: "Compliance & Governance",
    body: "Immutable audit trail, CQC-ready reports, and ICS-level governance dashboards for medical directors and CIOs.",
  },
];

export default function ForHospitalsPage() {
  return (
    <AudiencePage
      kicker="For Hospitals"
      title="Command Your Hospital. Not Just Your Dashboard."
      description="For hospital CEOs, COOs, medical directors, and CIOs — Aksh Health provides real-time operational intelligence across Epic, Oracle Health, and NHS Spine-connected systems."
      ctaHref="/pilot/apply"
      ctaLabel="Book Executive Briefing"
    >
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border p-6">
                <h2 className="text-lg font-bold text-navy">{section.title}</h2>
                <p className="mt-2 text-sm text-steel">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AudiencePage>
  );
}
