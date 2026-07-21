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
    body: "Practice managers, ICS leads, and trust procurement — request a guided walkthrough and tenancy scoping.",
    href: "/get-started",
    cta: "Request organisation access",
  },
  {
    title: "Create an account",
    body: "Explore role dashboards in proof mode. Enterprise clinical identity is not connected in this build.",
    href: "/signup",
    cta: "Create account",
  },
  {
    title: "See the product",
    body: "Synthetic Patel practice journey: ETL, GP consult, HITL queue, pharmacist, SHIELD, and regional COMPASS.",
    href: "/demo/patel",
    cta: "Walk the Patel demo",
  },
  {
    title: "Security & clinical safety",
    body: "GDPR Art. 9 framing, HITL gates, MHRA-aware positioning, and DCB0129 safety case status (in progress).",
    href: "/security",
    cta: "View security",
  },
] as const;

export default function ContactPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Contact"
        title="Talk to Aksh Health"
        lede="Choose the path that matches your question. For NHS organisation deployments, start with a formal access request so we can route clinical safety and integration conversations correctly."
        primary={{ label: "Request organisation access", href: "/get-started" }}
        secondary={{ label: "Read the FAQ", href: "/faq" }}
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
              . Clinical safety documentation requests: use organisation access so we can verify the requesting trust or
              practice.
            </p>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Prefer a live walkthrough?"
        lede="Eight role dashboards. FHIR R4 ready design for EMIS Web and SystmOne. Human approval on every output."
        primary={{ label: "Get in touch", href: "/get-started" }}
        secondary={{ label: "Platform overview", href: "/platform" }}
      />
    </MarketingShell>
  );
}
