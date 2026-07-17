import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container, frame } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Case walkthrough | ${SEO_DEFAULTS.title}`,
  description:
    "Frame the Patel practice demo: consult capture, draft and clinical checks, clinician approval, and FHIR staging for EMIS Web and SystmOne.",
};

const beats = [
  {
    step: "01",
    title: "Capture the consult",
    body: "A GP consult with Mr J. Patel is captured — notes or voice — with practice context ready for morning clinic.",
  },
  {
    step: "02",
    title: "Draft + clinical checks",
    body: "A SOAP draft, safety flags, and referral suggestions stage for review. Risk signals surface with a clear 14-day horizon.",
  },
  {
    step: "03",
    title: "Clinician approves",
    body: "Accept, edit, or reject. Nothing reaches the record without a named decision. Approved outputs stage as FHIR R4 for EMIS Web and SystmOne paths.",
  },
] as const;

export default function WalkthroughPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Case walkthrough"
        title="Walk the Patel practice end to end."
        lede="A synthetic GP story that shows capture, drafts and checks, clinician approval, and audit — then open the live demo when you are ready."
        primary={{ label: "Open live demo", href: "/demo/patel" }}
        secondary={{ label: "Talk to us", href: "/get-started" }}
      />

      <section className="py-12 md:py-16">
        <div className={container}>
          <div className="mb-8 max-w-2xl">
            <p className="owkin-roles__eyebrow">What you will see</p>
            <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">Three beats, one clinical story</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
              This page frames the demo. It does not replace role dashboards or authenticated workflows — it orients
              buyers and clinicians before they click into{" "}
              <Link href="/demo/patel" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                /demo/patel
              </Link>
              .
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-3">
            {beats.map((beat) => (
              <li
                key={beat.step}
                className={frame}
              >
                <p className="text-xs font-bold tracking-[0.14em] text-[var(--owkin-royal)]">{beat.step}</p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--owkin-ink)]">{beat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{beat.body}</p>
              </li>
            ))}
          </ol>

          <div className={`${frame} mt-10`}>
            <h3 className="text-lg font-semibold text-[var(--owkin-ink)]">Before you start</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-steel">
              <li>Live demo routes use synthetic Patel practice data.</li>
              <li>Some steps require sign-in; public clinician surfaces stay open without an account.</li>
              <li>Production write-back to EMIS or SystmOne stays gated until organisation governance sign-off.</li>
            </ul>
            <div className="mt-6">
              <Link href="/demo/patel" className="owkin-btn-ink">
                Launch Patel demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Want this for your organisation?"
        lede="Request organisation access, or create an account and complete personalised onboarding."
        primary={{ label: "Talk to us", href: "/get-started" }}
        secondary={{ label: "Create account", href: "/signup" }}
      />
    </MarketingShell>
  );
}
