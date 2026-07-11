import type { Metadata } from "next";
import Link from "next/link";

import { AudiencePage } from "@/components/marketing/AudienceHero";

export const metadata: Metadata = {
  title: "For Clinicians",
  description: "GP and nurse conversion — AI clinical copilot, documentation, and human-approved workflows for EMIS and SystmOne practices.",
};

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
    <AudiencePage
      kicker="For Clinicians"
      title="Spend Time With Patients. Not Paperwork."
      description="Aksh Health gives GPs and nurses an AI clinical copilot that connects to EMIS Web and SystmOne — documenting consultations, checking safety, and coordinating care while you stay in control."
      ctaHref="/signup?role=gp"
      ctaLabel="Get Started as a Clinician"
    >
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-border p-6">
                <h2 className="text-base font-bold text-navy">{feature.title}</h2>
                <p className="mt-2 text-sm text-steel">{feature.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-emerald/20 bg-emerald/5 p-6">
            <h3 className="font-bold text-emerald">Human-in-the-Loop</h3>
            <p className="mt-2 text-sm text-steel">
              Aksh Health is not autonomous AI. Every clinical output requires your explicit approval. NHS DCB0129
              compliant with a full immutable audit trail.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard/gp" className="rounded-xl bg-navy px-6 py-3 font-bold text-white hover:bg-navy/90">
              Try GP dashboard demo
            </Link>
            <Link
              href="/onboarding?role=gp"
              className="rounded-xl border border-navy px-6 py-3 font-bold text-navy hover:bg-navy/5"
            >
              GP onboarding path
            </Link>
          </div>
        </div>
      </section>
    </AudiencePage>
  );
}
