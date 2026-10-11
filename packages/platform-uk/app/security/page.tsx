import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import { COMPLIANCE_DISCLAIMER } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: "Clinical safety & security ",
  description:
    "Human-in-the-loop review, immutable audit trails, GDPR Art. 9 handling, and honest clinical-safety positioning — without certification claims.",
};

const sections = [
  {
    title: "Human-in-the-loop on every clinical output",
    body: "Supporting intelligence drafts. A named reviewer must Accept, Edit, or Reject before anything can affect a care record.",
    bullets: [
      "Draft-only until a named clinician decides",
      "No autonomous diagnosis, prescribing, or treatment",
    ],
  },
  {
    title: "Immutable audit trail",
    body: "Who drafted, who reviewed, and what they decided — recorded so governance teams can reconstruct the path.",
    bullets: [
      "Capability, timestamp, and reviewer on every decision",
      "Zero auto-writes: drafts never self-commit",
    ],
  },
  {
    id: "dcb0129",
    title: "Clinical safety case (in progress)",
    body: "Workflow design follows hazard-aware clinical safety practice. A signed-off safety case is not complete for this build. The clinical-risk and medical-device pathways required where each organisation operates remain scaffolding, not approvals.",
    bullets: [
      "Hazard log is internal — not a public certificate",
      "Production EHR write-back stays gated until organisation sign-off",
    ],
  },
  {
    title: "Special category health data",
    body: "Health data is treated as the most sensitive category of personal data: purpose limitation, minimisation, and tenant isolation for every organisation deployment.",
    bullets: [
      "Data hosted in the region each organisation chooses",
      "Encryption in transit and at rest; role-based access",
    ],
  },
] as const;

const notClaimed = [
  "Medical device certification, registration, or marking by any regulator",
  "Completed clinical safety case sign-off",
  "An approved health-system procurement or technology assessment outcome",
  "Care-regulator readiness or inspection evidence",
  "Live production write-back to any EHR in this public build",
  "Autonomous diagnosis, prescribing, or treatment decisions",
  "A validated physiological digital twin — precision-health is scaffolding, not a live digital twin claim",
] as const;

export default function SecurityPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Clinical safety & security"
        title="Trust is a gate, not a slogan."
        lede="Human review, audit trails, and honest compliance language for clinical deployments — without inventing certifications."
        primary={{ label: "Request organisation access", href: "/get-started" }}
      />

      <TrustStrip />

      <section className="py-14 md:py-16">
        <div className={container}>
          <div className="mb-10 max-w-2xl">
            <p className="owkin-roles__eyebrow mb-3">How we govern clinical outputs</p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mk-ink)] md:text-4xl">
              Safety controls that stay visible
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mk-muted)]">
              {COMPLIANCE_DISCLAIMER} This page describes design posture — not regulatory approval.
            </p>
          </div>

          <ol className="aksh-security-list">
            {sections.map((section, index) => (
              <li
                key={section.title}
                id={"id" in section ? section.id : undefined}
                className="aksh-security-list__item scroll-mt-24"
              >
                <span className="aksh-security-list__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="dtac" className="scroll-mt-24 border-y border-[var(--mk-line)] py-14 md:py-16">
        <div className={container}>
          <div className="mb-8 max-w-2xl">
            <p className="owkin-roles__eyebrow mb-3">What we do not claim</p>
            <h2 className="font-[family-name:var(--font-marketing-display)] text-3xl font-semibold tracking-tight text-[var(--mk-ink)] md:text-4xl">
              Honest limits
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--mk-muted)]">
              If a badge or sentence would overstate status, we leave it out.
            </p>
          </div>
          <ul className="aksh-limits-list">
            {notClaimed.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[var(--mk-muted)]" id="precision-health">
            Precision-health work in this product is phased scaffolding — not a live digital twin claim, and not a
            validated physiological digital twin.{" "}
            <Link href="/platform" className="font-medium text-[var(--mk-accent-strong)] underline-offset-4 hover:underline">
              Platform overview
            </Link>
          </p>
        </div>
      </section>

      <MarketingCtaBand
        title="Review the safety posture with your team"
        lede="Request organisation access and we will take your team through it."
        primary={{ label: "Request organisation access", href: "/get-started" }}
      />
    </MarketingShell>
  );
}
