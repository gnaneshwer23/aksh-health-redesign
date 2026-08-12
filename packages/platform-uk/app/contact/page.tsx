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
    body: "For practice managers, regional leads, and hospital procurement.",
    href: "/get-started",
    cta: "Request access",
  },
  {
    title: "Product walkthrough",
    body: "Synthetic Patel practice: consult, review queue, pharmacy, and audit.",
    href: "/demo/patel",
    cta: "Open walkthrough",
  },
  {
    title: "Security & clinical safety",
    body: "HITL gates, GDPR Art. 9 framing, and honest limits.",
    href: "/security",
    cta: "View security",
  },
] as const;

const faqs = [
  {
    q: "Does Aksh Health replace my EHR?",
    a: "No. It sits above existing EHR workflows. Production write-back stays gated behind organisation governance and clinical safety sign-off.",
  },
  {
    q: "Is Aksh Health MHRA-certified?",
    a: "No. We position the product as clinical decision support with human review. We do not claim MHRA certification, completed clinical safety case sign-off, or CQC readiness.",
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
        lede="Organisation access, a product walkthrough, or a clinical safety conversation."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Create an account", href: "/signup" }}
      />

      <section className="owkin-contact">
        <div className={container}>
          <div className="aksh-contact-list">
            {contacts.map((item) => (
              <Link key={item.title} href={item.href} className="aksh-contact-list__item">
                <div>
                  <h2>{item.title}</h2>
                  <p>{item.body}</p>
                </div>
                <span className="owkin-text-cta">
                  {item.cta}
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 max-w-2xl rounded-[1.75rem] border border-[var(--mk-line)] bg-white p-6 shadow-[var(--mk-shadow-frame)] sm:p-7">
            <h2 className="mb-2 font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-[var(--mk-ink)]">
              Direct email
            </h2>
            <p className="text-sm leading-relaxed text-[var(--mk-muted)]">
              General and partnership enquiries:{" "}
              <a className="font-medium text-[var(--mk-accent-strong)] underline-offset-4 hover:underline" href="mailto:hello@akshhealth.com">
                hello@akshhealth.com
              </a>
            </p>
          </div>

          <div className="mt-14 max-w-2xl">
            <h2 className="mb-6 font-[family-name:var(--font-marketing-display)] text-2xl font-semibold text-[var(--mk-ink)]">
              Common questions
            </h2>
            <dl className="space-y-3">
              {faqs.map((item) => (
                <div
                  key={item.q}
                  className="rounded-[1.5rem] border border-[var(--mk-line)] bg-white px-5 py-4 shadow-[var(--mk-shadow-frame)]"
                >
                  <dt className="font-medium text-[var(--mk-ink)]">{item.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[var(--mk-muted)]">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Need a guided conversation?"
        lede="Request organisation access and we will route it to the right team."
        primary={{ label: "Request access", href: "/get-started" }}
        secondary={{ label: "Platform overview", href: "/platform" }}
      />
    </MarketingShell>
  );
}
