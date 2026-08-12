import type { Metadata } from "next";
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
    body: "Specialist agents draft. A named reviewer must Accept, Edit, or Reject before anything can affect a care record.",
    bullets: [
      "Draft-only until a named clinician decides",
      "No autonomous diagnosis, prescribing, or treatment",
    ],
  },
  {
    title: "Immutable audit trail (SHIELD)",
    body: "Who drafted, who reviewed, and what they decided — recorded so governance teams can reconstruct the path.",
    bullets: [
      "Agent, timestamp, and reviewer on every decision",
      "Zero auto-writes: drafts never self-commit",
    ],
  },
  {
    id: "dcb0129",
    title: "DCB0129 / clinical safety case (in progress)",
    body: "Workflow design aligns with NHS DCB0129 expectations. A signed-off safety case is not complete for this build.",
    bullets: [
      "Hazard log is internal — not a public certificate",
      "Production EHR write-back stays gated until sign-off",
    ],
  },
  {
    title: "GDPR Art. 9 special category data",
    body: "Health data is treated as special category information: purpose limitation, minimisation, and tenant isolation for organisation deployments.",
    bullets: [
      "UK/EU residency framing for NHS workloads",
      "Encryption in transit and at rest; role-based access",
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
  "A validated physiological digital twin — precision-health is scaffolding, not a live digital twin claim",
] as const;

export default function SecurityPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Clinical safety & security"
        title="Trust is a gate, not a slogan."
        lede="Human review, audit trails, and honest compliance language for NHS deployments — without inventing certifications."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "See the demo", href: "/demo/patel" }}
      />

      <TrustStrip />

      <section className="py-12 md:py-16">
        <div className={container}>
          <div className="mb-10 max-w-2xl">
            <p className="owkin-roles__eyebrow">How we govern clinical outputs</p>
            <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">
              Safety controls that stay visible
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
              {COMPLIANCE_DISCLAIMER} This page describes design posture — not regulatory approval. Data protection and
              clinical safety for NHS deployments.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section, index) => (
              <div key={section.title} id={"id" in section ? (section as { id?: string }).id : undefined} className="scroll-mt-24">
                <PastelCapabilityCard
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
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="dtac" className="scroll-mt-24 border-y border-black/5 bg-white py-12 md:py-16">
        <div className={container}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div>
              <p className="owkin-roles__eyebrow">What we do not claim</p>
              <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">Honest limits</h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
                If a badge or sentence would overstate status, we leave it out.
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

      <section id="precision-health" className="scroll-mt-24 py-10">
        <div className={container}>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--owkin-muted)]">
            Precision-health work in this product is phased scaffolding — not a live digital twin claim, and not a
            validated physiological digital twin.
          </p>
        </div>
      </section>

      <MarketingCtaBand
        title="Review the safety posture with your team"
        lede="Walk the Patel case for human-in-the-loop in context, or request organisation access."
        primary={{ label: "See the demo", href: "/demo/patel" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />
    </MarketingShell>
  );
}
