import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldAlert } from "lucide-react";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container, frame } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PastelCapabilityCard, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";
import TrustStrip from "@/components/marketing/TrustStrip";
import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: "Clinical safety & security | Aksh Health",
  description:
    "Human-in-the-loop review, SHIELD audit trails, GDPR Art. 9 handling, and MHRA/DCB0129-aware positioning — without certification claims.",
};

const sections = [
  {
    title: "Human-in-the-loop on every clinical output",
    body: "Aksh Health is clinical decision support, not an autonomous clinician. Specialist agents draft and check work; a named reviewer must Accept, Edit, or Reject before anything can affect a care record or pathway.",
    bullets: [
      "Draft-only staging until named clinician decision",
      "Accept freezes evidence and appends AuditEvent",
      "Edit and Reject leave a recorded rationale trail",
      "No autonomous diagnosis, prescribing, or treatment decisions",
    ],
  },
  {
    title: "Immutable audit trail (SHIELD)",
    body: "SHIELD records who saw what, which agent produced a draft, and what the clinician decided. AuditEvents are designed to travel with export bundles so governance teams can reconstruct the decision path.",
    bullets: [
      "Agent identity, timestamp, and reviewer identity on decisions",
      "Zero auto-writes posture: draft outputs never self-commit",
      "Midnight ETL and integration runs surfaced for ops review",
      "Role-scoped views across GP, pharmacy, admin, and regional dashboards",
    ],
  },
  {
    title: "DCB0129 / clinical safety case (in progress)",
    body: "We align workflow design with NHS DCB0129 clinical safety case expectations. A signed-off safety case is not complete for this build. Hazard identification, risk grading, and residual-risk sign-off remain under clinical safety officer ownership.",
    bullets: [
      "Hazard log structure maintained internally — not a public certificate",
      "HITL gate treated as a primary control against unreviewed AI output harm",
      "Production EHR write-back stays gated until residual risk sign-off",
      "DTAC evidence scaffolding for procurement conversations — not an approved assessment",
    ],
  },
  {
    title: "MHRA-aware positioning",
    body: "We position Aksh Health as software that supports clinical decision-making under human control. We do not claim MHRA device certification, nor that the product is an autonomous diagnostic system.",
    bullets: [
      "Decision support framing with explicit human gate",
      "No claim of CE / UKCA marking or MHRA registration completed",
      "No claim of CQC readiness or regulatory approval",
      "Deployment language stays honest for NHS buyers and clinicians",
    ],
  },
  {
    title: "GDPR Art. 9 special category data",
    body: "Health data receives heightened protection under UK GDPR. Consent, purpose limitation, data minimisation, and subject-rights workflows are mapped for special category health information in organisation deployments.",
    bullets: [
      "Purpose limitation on clinical AI processing",
      "Lawful basis and consent scaffolding per deployment",
      "Minimisation: only fields required for the clinical task",
      "Tenant isolation for multi-site practice deployments",
    ],
  },
  {
    title: "Data residency, encryption, and access control",
    body: "Clinical data is designed for UK/EU hosting boundaries appropriate for NHS workloads. TLS in transit, platform encryption at rest, NextAuth sessions, and role-based access control govern who can view, edit, and approve outputs.",
    bullets: [
      "UK/EU residency framing for NHS procurement",
      "Encryption in transit and at rest by default",
      "RBAC across GP, nurse, pharmacist, admin, ICS, and research views",
      "Secure session cookies via NextAuth",
    ],
  },
  {
    title: "EHR integration readiness",
    body: "Outputs stage as FHIR R4 drafts designed for EMIS Web and SystmOne exchange patterns. Production write-back is not enabled until organisation governance and clinical safety sign-off complete.",
    bullets: [
      "FHIR R4 staging for clinician-approved outputs",
      "Integration health monitoring for staging / adapter readiness",
      "External integrations configurable per tenancy",
      "Designed for EMIS Web and SystmOne — connections not live by default",
    ],
  },
] as const;

const notClaimed = [
  "MHRA certification, registration, or device marking",
  "Completed DCB0129 clinical safety case sign-off",
  "Approved DTAC assessment outcome",
  "CQC readiness or inspection evidence",
  "Live production write-back to EMIS Web or SystmOne in this public build",
  "Autonomous diagnosis, prescribing, or treatment decisions",
] as const;

export default function SecurityPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Clinical safety & security"
        title="Trust is a gate, not a slogan."
        lede="Human review, audit trails, and honest compliance language for NHS deployments — aligned with clinical safety pathways, without inventing certifications."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Platform resources", href: "/resources" }}
      />

      <TrustStrip />

      <section className="py-12 md:py-16">
        <div className={container}>
          <div className="mb-10 max-w-2xl">
            <p className="owkin-roles__eyebrow">How we govern clinical outputs</p>
            <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">
              Safety controls that stay visible in the product
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
              {COMPLIANCE_DISCLAIMER} This page describes design posture and active pathways — not regulatory approval.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <PastelCapabilityCard
                key={section.title}
                variant={pastelVariantAt(index)}
                icon={FileText}
                title={section.title}
                description={section.body}
                compact
                footer={
                  <ul className="mt-4 list-disc space-y-1.5 pl-4 text-sm text-steel">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                }
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white py-12 md:py-16">
        <div className={container}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <p className="owkin-roles__eyebrow">What we do not claim</p>
              <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">Honest limits</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
                Procurement and clinical safety conversations go better when claims stay precise. If a badge or sentence
                would overstate status, we leave it out.
              </p>
              <p className="mt-6 text-sm text-[var(--owkin-muted)]">
                Need the longer reference?{" "}
                <Link href="/resources#dcb0129" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  DCB0129 outline
                </Link>
                ,{" "}
                <Link href="/resources#dtac" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  DTAC checklist
                </Link>
                , or{" "}
                <Link href="/faq" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  FAQ
                </Link>
                .
              </p>
            </div>
            <div className={frame}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pastel-peach">
                  <ShieldAlert className="h-5 w-5 text-pastel-peach-ink" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-[var(--owkin-ink)]">Not claimed in this build</p>
              </div>
              <ul className="space-y-3">
                {notClaimed.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-black/6 bg-white px-4 py-3 text-sm leading-relaxed text-steel"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Ready to review the safety posture with your team?"
        lede="Walk the Patel case for HITL in context, or request organisation access for a guided conversation."
        primary={{ label: "Case walkthrough", href: "/walkthrough" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />
    </MarketingShell>
  );
}
