import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Contact | ${SEO_DEFAULTS.title}`,
  description:
    "Contact Aksh Health for organisation access, clinical safety questions, partnership, or general enquiries.",
};

const contacts = [
  {
    title: "Organisation access",
    body: "Practice managers, ICS leads, and trust procurement — request a guided walkthrough.",
    href: "/get-started",
    cta: "Request access",
  },
  {
    title: "See the product",
    body: "Synthetic Patel practice: consult, review queue, pharmacy, and audit.",
    href: "/demo/patel",
    cta: "Open the demo",
  },
  {
    title: "Security & clinical safety",
    body: "HITL gates, GDPR Art. 9 framing, and honest limits — not a signed safety case.",
    href: "/security",
    cta: "View security",
  },
] as const;

const faqs = [
  {
    q: "Does Aksh Health replace EMIS Web or SystmOne?",
    a: "No. It sits above existing EHR workflows. Production write-back stays gated behind organisation governance and clinical safety sign-off.",
  },
  {
    q: "Is Aksh Health MHRA-certified?",
    a: "No. We position the product as clinical decision support with human review. We do not claim MHRA certification, DCB0129 sign-off, or CQC readiness.",
  },
  {
    q: "What is human-in-the-loop?",
    a: "Every output is a draft. A named clinician must Accept, Edit, or Reject before anything can reach the record.",
  },
] as const;

export default function ContactPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Contact"
        title="Talk to Aksh Health"
        lede="Organisation access, a product demo, or a clinical safety conversation — pick the shortest path."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Create an account", href: "/signup" }}
      />

      <section className="owkin-contact">
        <div className={container}>
          <div className="owkin-contact__grid">
            {contacts.map((item) => (
              <Link key={item.title} href={item.href} className="owkin-contact__card">
                <h2>{item.title}</h2>
                <p>{item.body}</p>
                <span className="owkin-text-cta mt-auto">
                  {item.cta}
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 max-w-2xl rounded-2xl border border-navy/[0.08] bg-white/70 p-6">
            <h2 className="mb-2 font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-navy-dark">
              Direct email
            </h2>
            <p className="text-sm leading-relaxed text-slate/75">
              General and partnership enquiries:{" "}
              <a className="font-medium text-navy-dark underline-offset-4 hover:underline" href="mailto:hello@akshhealth.com">
                hello@akshhealth.com
              </a>
            </p>
          </div>

          <div className="mt-14 max-w-2xl">
            <h2 className="mb-6 font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-navy-dark">
              Common questions
            </h2>
            <dl className="space-y-6">
              {faqs.map((item) => (
                <div key={item.q}>
                  <dt className="font-medium text-navy-dark">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-slate/75">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Prefer a live walkthrough?"
        lede="Request organisation access and we will route the conversation to the right team."
        primary={{ label: "Get started", href: "/get-started" }}
        secondary={{ label: "Platform overview", href: "/platform" }}
      />
    </MarketingShell>
  );
}
