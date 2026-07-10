import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "For Hospitals",
  "Hospital Command Centre, capacity prediction, digital twin, and workforce intelligence for NHS trusts and private providers."
);

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
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            For Hospitals
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Command Your Hospital. Not Just Your Dashboard.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            For hospital CEOs, COOs, medical directors, and CIOs — Aksh Health
            provides real-time operational intelligence across Epic, Oracle
            Health, and NHS Spine-connected systems.
          </p>
          <Button variant="hero" className="mt-8" asChild>
            <Link href="/pilot/apply?type=hospital">Book Executive Briefing</Link>
          </Button>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{section.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
