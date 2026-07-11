import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/marketing/Footer";
import Navbar from "@/components/marketing/Navbar";
import { COMPLIANCE_BADGES, COMPLIANCE_DISCLAIMER, SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Documentation — ${SEO_DEFAULTS.title}`,
  description: "Architecture overview, FHIR resources, HITL specification, and compliance design pathways for AkshHealth.",
};

export default function DocsPage() {
  return (
    <div className="marketing-site flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1 bg-white pt-24">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald">Documentation portal · v1</p>
          <h1 className="mt-3 text-4xl font-bold text-navy">Compliance-aware clinical AI architecture.</h1>
          <p className="mt-4 text-lg text-steel">
            Public documentation for architecture, FHIR R4 staging, human-in-the-loop review, and integration
            placeholders. Internal clinical safety evidence remains confidential.
          </p>
        </section>

        <section className="border-t border-border bg-surface py-12">
          <div className="mx-auto grid max-w-4xl gap-8 px-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-steel">Architecture</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">Five layers, seven agents, one review queue.</h2>
              <p className="mt-3 text-steel">
                Consultation intake flows through named clinical agents (VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE,
                EQUITY, SHIELD). Outputs land in a draft review queue. No autonomous write-back to active clinical
                records.
              </p>
            </div>
            <div className="space-y-3 text-sm">
              <Link href="/dashboard/gp" className="block font-medium text-navy hover:underline">
                Clinician dashboard demo
              </Link>
              <Link href="/review" className="block font-medium text-navy hover:underline">
                Review queue
              </Link>
              <Link href="/api/system/database-contract" className="block font-medium text-navy hover:underline">
                Database adapter contract
              </Link>
              <Link href="/api/system/integration-contract" className="block font-medium text-navy hover:underline">
                Integration boundary contract
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl space-y-8 px-6 py-12">
          <div>
            <h2 className="text-xl font-bold text-navy">FHIR R4 resources (staged)</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-steel">
              <li>Encounter, Condition, MedicationRequest, Observation — collection bundle export</li>
              <li>AuditEvent — SHIELD compliance trail on Accept / Edit / Reject</li>
              <li>DocumentReference — SYNTHESIS SOAP output (review queue)</li>
              <li>RiskAssessment — ORACLE score updates</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy">HITL specification</h2>
            <p className="mt-3 text-steel">
              Queue items carry agent badges and DRAFT status until a named reviewer records a decision. Full case
              Accept freezes evidence artifacts and appends FHIR AuditEvent resources to the export bundle.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-navy">Compliance frameworks (design alignment)</h2>
            <p className="mt-3 text-sm text-steel">{COMPLIANCE_DISCLAIMER}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {COMPLIANCE_BADGES.map((badge) => (
                <article key={badge.id} className="rounded-xl border border-border p-4">
                  <strong className="text-navy">{badge.label}</strong>
                  <p className="mt-1 text-sm text-steel">{badge.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
