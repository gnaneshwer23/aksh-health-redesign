import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "For Administrators",
  "Practice and ICS administration — governance, audit trails, population health, and multi-site coordination."
);

const sections = [
  {
    title: "Practice Management",
    body: "Configure AI agent permissions, manage clinician onboarding, and monitor documentation time savings across your GP network.",
  },
  {
    title: "ICS Population Health",
    body: "Cross-practice analytics, equity monitoring, and population intervention triggers across your Integrated Care System.",
  },
  {
    title: "Governance & Audit",
    body: "Immutable audit trail for every AI decision. DCB0129 compliance reporting and CQC-ready evidence packs.",
  },
  {
    title: "Integration Management",
    body: "Monitor FHIR R4 and HL7 v2 connectivity to EMIS Web, SystmOne, and NHS Spine. No migration required.",
  },
  {
    title: "Pilot Programme Administration",
    body: "Dedicated implementation team support, CSO engagement, and data reports for ICS pilot cohorts.",
  },
  {
    title: "Role-Based Access Control",
    body: "Granular permissions for GPs, nurses, pharmacists, practice managers, and ICS leads across all agent outputs.",
  },
];

export default function ForAdministratorsPage() {
  return (
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            For Administrators
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Govern Intelligence. Not Just Access.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            For practice managers and ICS leads — administer AI agent permissions,
            monitor population health outcomes, and maintain compliance across
            your organisation.
          </p>
          <Button variant="hero" className="mt-8" asChild>
            <Link href="/signup?role=practice-manager">Admin Sign Up</Link>
          </Button>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Card key={section.title}>
                <CardHeader>
                  <CardTitle className="text-base">{section.title}</CardTitle>
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
