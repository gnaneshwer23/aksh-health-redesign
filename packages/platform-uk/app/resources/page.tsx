import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { COMPLIANCE_DISCLAIMER, SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Platform resources | ${SEO_DEFAULTS.title}`,
  description:
    "Architecture overview, FHIR R4 staging, human-in-the-loop specification, compliance pathways, and integration design for Aksh Health.",
};

const resourceSections = [
  {
    title: "Architecture overview",
    body: "Aksh Health organises clinical AI into five layers: intake, agent orchestration, synthesis, review queue, and export. Consultation data flows through named clinical agents. Outputs land in a draft review queue. No autonomous write-back to active clinical records.",
    bullets: [
      "Five layers: intake, agents, synthesis, review, export",
      "Seven agents: VOICE, SYNTHESIS, DrASSIST, GUARDIAN, ORACLE, EQUITY, SHIELD",
      "FHIR R4 resources staged as DRAFT until named reviewer approval",
      "Human-in-the-loop on every clinical output before record impact",
    ],
  },
  {
    title: "Compliance frameworks",
    body: "Aksh Health aligns with NHS clinical safety and digital technology assessment pathways. We do not claim certification. Internal clinical safety evidence remains confidential; public resources describe design alignment only.",
    bullets: [
      "DCB0129 clinical safety case pathway in active development",
      "DTAC-aligned evidence scaffolding for NHS procurement",
      "GDPR Art. 9 special category health data handling",
      "MHRA-aware positioning: decision support, not autonomous diagnosis",
      "Synthetic-safe demo: no live EHR connection in public builds",
    ],
  },
  {
    title: "FHIR and interoperability",
    body: "Clinical outputs are staged as FHIR R4 draft resources for reviewer inspection. Integration architecture is designed for EMIS Web and SystmOne, the dominant UK primary care EHR systems. Production EHR connections are not live in this build.",
    bullets: [
      "Encounter, Condition, MedicationRequest, Observation in collection bundles",
      "DocumentReference for SYNTHESIS SOAP output in the review queue",
      "RiskAssessment for ORACLE score updates",
      "AuditEvent for SHIELD compliance trail on Accept, Edit, Reject",
      "Designed for EMIS Web and SystmOne FHIR exchange patterns",
    ],
  },
  {
    title: "HITL specification",
    body: "Every AI-generated clinical output requires named clinician review before it reaches a care record or pathway. Queue items carry agent badges and DRAFT status until a reviewer records a decision.",
    bullets: [
      "Accept: freeze evidence artifacts and append FHIR AuditEvent to export bundle",
      "Edit: reviewer modifies draft content before acceptance",
      "Reject: discard output with audit trail; no write to clinical record",
      "Draft-only writes: no production record impact without explicit approval",
    ],
  },
] as const;

const quickLinks = [
  {
    label: "Security",
    description: "Data protection, GDPR Art. 9, RBAC, and audit trails.",
    href: "/security",
  },
  {
    label: "Integrations",
    description: "FHIR R4, EMIS Web, SystmOne, and API architecture.",
    href: "/integrations",
  },
  {
    label: "Platform",
    description: "Eight role dashboards and agent orchestration overview.",
    href: "/platform",
  },
  {
    label: "Get started",
    description: "Request access and explore the synthetic demo.",
    href: "/signup",
  },
] as const;

export default function ResourcesPage() {
  return (
    <MarketingShell overDarkHero>
      <section className="relative overflow-hidden bg-medicom-navy pb-12 pt-24 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:48px_48px] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald">Platform resources</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Compliance-aware clinical AI for the NHS
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Architecture, FHIR R4 staging, human-in-the-loop review, and compliance design pathways for NHS primary
            and secondary care. Public resources for procurement and technical evaluation.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-emerald px-8 py-3.5 text-center text-base font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
            >
              Get started
            </Link>
            <Link
              href="/platform"
              className="rounded-xl border-2 border-white/70 px-8 py-3.5 text-center text-base font-bold text-white transition-all hover:bg-white/10"
            >
              View platform
            </Link>
          </div>
        </div>
        <TrustStrip />
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-bold text-navy md:text-3xl">Technical and compliance reference</h2>
            <p className="mt-3 text-sm leading-relaxed text-steel">
              {COMPLIANCE_DISCLAIMER} Resources below describe design alignment, not certification or regulatory
              approval.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {resourceSections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border bg-surface p-6">
                <h3 className="text-xl font-bold text-navy">{section.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-steel">{section.body}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-steel">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">Related pages</h2>
          <p className="mt-3 max-w-2xl text-sm text-steel">
            Explore security posture, integration architecture, platform capabilities, and onboarding.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-emerald/30 hover:shadow-card"
              >
                <span className="flex items-center justify-between text-base font-bold text-navy">
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-emerald transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="mt-2 text-sm leading-relaxed text-steel">{link.description}</span>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm">
            <Link href="/api/system/database-contract" className="font-medium text-navy hover:underline">
              Database adapter contract
            </Link>
            <Link href="/api/system/integration-contract" className="font-medium text-navy hover:underline">
              Integration boundary contract
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-emerald py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold">Ready to evaluate Aksh Health?</h2>
          <p className="mt-4 text-sm text-white/80">
            Request access to the synthetic demo or speak with our team about NHS deployment pathways.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald transition-colors hover:bg-white/90"
            >
              Get started
            </Link>
            <Link
              href="/security"
              className="rounded-xl border-2 border-white/80 px-8 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Security overview
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
