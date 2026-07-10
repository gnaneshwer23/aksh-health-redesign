import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "NHS Phase 1 Pilot",
  "NHS Phase 1 Pilot — October 2026. Three ICS sites across urban, suburban, and rural settings."
);

const sites = [
  {
    name: "Urban ICS Site",
    detail: "50 clinicians, 1,600 patients, EMIS Web integration",
  },
  {
    name: "Suburban ICS Site",
    detail: "50 clinicians, 1,600 patients, SystmOne integration",
  },
  {
    name: "Rural ICS Site",
    detail: "50 clinicians, 1,600 patients, EMIS Web or SystmOne",
  },
];

const metrics = [
  "Reduction in avoidable admissions",
  "Documentation time saved per consultation",
  "Care coordination speed improvement",
  "Patient engagement rate",
];

const provided = [
  "Dedicated implementation team",
  "CSO clinical safety support",
  "Quarterly data reports",
  "No upfront cost for pilot sites",
];

export default function PilotPage() {
  return (
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Pilot Programme
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            NHS Phase 1 Pilot — October 2026
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Three Integrated Care System sites — urban, suburban, and rural —
            deploying Aksh Health across GP networks with EMIS Web and SystmOne.
          </p>
          <Button variant="hero" className="mt-8" asChild>
            <Link href="/pilot/apply">Apply for Pilot Cohort</Link>
          </Button>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <h2 className="text-2xl font-bold">Pilot Sites</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {sites.map((site) => (
              <Card key={site.name}>
                <CardHeader>
                  <CardTitle className="text-base">{site.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{site.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Success Metrics</h2>
              <ul className="mt-4 space-y-2">
                {metrics.map((metric) => (
                  <li key={metric} className="flex gap-2 text-sm">
                    <span className="text-accent">✓</span>
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold">What Aksh Provides</h2>
              <ul className="mt-4 space-y-2">
                {provided.map((item) => (
                  <li key={item} className="flex gap-2 text-sm">
                    <span className="text-primary">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
