import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `FAQ | ${SEO_DEFAULTS.title}`,
  description:
    "Answers about EMIS Web and SystmOne, FHIR R4, human-in-the-loop approval, who can access Aksh Health, demos, and data handling.",
};

const faqs = [
  {
    q: "Does Aksh Health replace EMIS Web or SystmOne?",
    a: "No. Aksh Health is designed to sit above existing EHR workflows. Integration paths target EMIS Web and SystmOne via FHIR R4–ready staging. Production write-back remains gated behind organisation governance and clinical safety sign-off.",
  },
  {
    q: "What is human-in-the-loop?",
    a: "Every agent output is staged as a draft. A named clinician must Accept, Edit, or Reject before anything reaches the FHIR record. There are no autonomous writes of clinical content.",
  },
  {
    q: "Who can access the platform?",
    a: "Organisations request access via Get in touch. Individuals can create an account for proof-mode dashboards. Role dashboards cover GP, nurse, pharmacist, practice admin, ICS/regional, hospital executive, patient (invite-only), and researcher.",
  },
  {
    q: "Can I see a demo before procurement?",
    a: "Yes. The Patel practice walkthrough is a synthetic end-to-end demo (midnight ETL → GP consult → HITL queue → pharmacist / SHIELD / regional views). Request organisation access for a guided demo with your team.",
  },
  {
    q: "Where is clinical data processed?",
    a: "Aksh Health is designed for UK/EU hosting boundaries appropriate for NHS workloads, with TLS in transit, encryption at rest, and tenant-scoped access. See Security for residency and GDPR Art. 9 framing.",
  },
  {
    q: "Is Aksh Health MHRA-certified or DCB0129-approved?",
    a: "No. We position the product as clinical decision support with human review — MHRA-aware, not an autonomous diagnostic system. The DCB0129 clinical safety case is in progress; we do not claim certification, accreditation, or CQC readiness.",
  },
  {
    q: "What FHIR resources are staged?",
    a: "Approved outputs are designed to stage as FHIR R4 resources such as DocumentReference (SOAP), Flag / MedicationRequest (safety), RiskAssessment, ServiceRequest (referrals), and AuditEvent (SHIELD). Exact production contracts depend on your integration path.",
  },
  {
    q: "How do I contact Aksh Health?",
    a: "Use Contact for general enquiries, Get in touch for organisation access, or Create account for individual proof-mode exploration.",
  },
] as const;

export default function FaqPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="FAQ"
        title="Questions procurement and clinical teams ask"
        lede="Straight answers on EMR fit, approval gates, demos, and compliance posture — without overclaiming certifications."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "View security", href: "/security" }}
      />

      <section className="owkin-faq">
        <div className={container}>
          <ul className="owkin-faq__list">
            {faqs.map((item) => (
              <li key={item.q}>
                <details className="owkin-faq__item">
                  <summary>{item.q}</summary>
                  <p className="owkin-faq__answer">{item.a}</p>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-slate/70">
            Need deeper documentation?{" "}
            <Link href="/resources" className="font-medium text-navy-dark underline-offset-4 hover:underline">
              Platform resources
            </Link>{" "}
            cover architecture, HITL, DCB0129 outline, and DTAC alignment.
          </p>
        </div>
      </section>

      <MarketingCtaBand
        title="Still deciding?"
        lede="Walk the Patel demo or request access for your NHS organisation."
        primary={{ label: "Walk the Patel demo", href: "/demo/patel" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </MarketingShell>
  );
}
