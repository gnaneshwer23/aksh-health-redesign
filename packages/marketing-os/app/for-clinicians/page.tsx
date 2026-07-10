import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalloutBox } from "@/components/shared/CalloutBox";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "For Clinicians",
  "GP and nurse conversion — AI clinical copilot, documentation, and human-approved workflows for EMIS and SystmOne practices."
);

const features = [
  {
    title: "Clinical Copilot",
    body: "Pre-consultation briefing, in-consultation decision support, and post-consultation task management — all in your existing workflow.",
  },
  {
    title: "SYNTHESIS Documentation",
    body: "Ambient note generation produces FHIR DocumentReference SOAP notes. You review, edit, and approve before anything writes to the record.",
  },
  {
    title: "GUARDIAN Safety Checks",
    body: "Real-time drug interaction, allergy, and contraindication checking with DetectedIssue FHIR resources.",
  },
  {
    title: "ORACLE Risk Scoring",
    body: "CVD, T2D, and frailty risk predictions surfaced as FHIR RiskAssessment resources in your review queue.",
  },
  {
    title: "Referral Agent",
    body: "Automated referral package creation with urgency prediction — ServiceRequest FHIR resources ready for your approval.",
  },
  {
    title: "One Review Queue",
    body: "All AI outputs in one place. Accept, edit, or reject. Nothing reaches the patient record without your explicit approval.",
  },
];

export default function ForCliniciansPage() {
  return (
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            For Clinicians
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            Spend Time With Patients. Not Paperwork.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Aksh Health gives GPs and nurses an AI clinical copilot that
            connects to EMIS Web and SystmOne — documenting consultations,
            checking safety, and coordinating care while you stay in control.
          </p>
          <Button variant="hero" className="mt-8" asChild>
            <Link href="/signup?role=gp">Get Started as a Clinician</Link>
          </Button>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <CalloutBox title="Human-in-the-Loop" variant="success" className="mt-10">
            Aksh Health is not autonomous AI. Every clinical output requires your
            explicit approval. NHS DCB0129 compliant with a full immutable audit
            trail.
          </CalloutBox>
        </div>
      </section>
    </>
  );
}
