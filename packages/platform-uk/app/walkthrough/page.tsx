import type { Metadata } from "next";
import Link from "next/link";

import { MarketingCtaBand } from "@/components/marketing/MarketingCtaBand";
import { container } from "@/components/marketing/marketing-ui";
import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SEO_DEFAULTS } from "@/lib/compliance-labels";

export const metadata: Metadata = {
  title: `Case walkthrough | ${SEO_DEFAULTS.title}`,
  description:
    "Frame the Patel practice demo: midnight ETL, voice consult, HITL review queue, ORACLE risk, SHIELD audit, and FHIR staging.",
};

const beats = [
  {
    step: "01",
    title: "Midnight ETL lands clean",
    body: "Synthetic practice data refreshes overnight. SHIELD shows the run status before morning clinic — no mystery loads.",
  },
  {
    step: "02",
    title: "Voice consult → governed draft",
    body: "A GP consult with Mr J. Patel is captured. VOICE and SYNTHESIS produce a SOAP draft and referral suggestions for review.",
  },
  {
    step: "03",
    title: "HITL queue, not auto-write",
    body: "The clinician Accepts, Edits, or Rejects. ORACLE surfaces 14-day admission risk. Nothing reaches the record without a named decision.",
  },
  {
    step: "04",
    title: "Audit and FHIR staging",
    body: "SHIELD records the trail. Approved outputs stage as FHIR R4 drafts designed for EMIS Web and SystmOne paths.",
  },
] as const;

export default function WalkthroughPage() {
  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow="Case walkthrough"
        title="Walk the Patel practice end to end."
        lede="A synthetic GP story that shows how voice, agents, human review, risk, and audit fit together — then open the live demo when you are ready."
        primary={{ label: "Open live demo", href: "/demo/patel" }}
        secondary={{ label: "Request organisation access", href: "/get-started" }}
      />

      <section className="py-16 md:py-20">
        <div className={container}>
          <div className="mb-10 max-w-2xl">
            <p className="owkin-roles__eyebrow">What you will see</p>
            <h2 className="owkin-display text-3xl text-[var(--owkin-ink)] md:text-4xl">Four beats, one clinical story</h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--owkin-muted)]">
              This page frames the demo. It does not replace role dashboards or authenticated workflows — it orients
              buyers and clinicians before they click into{" "}
              <Link href="/demo/patel" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                /demo/patel
              </Link>
              .
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-2">
            {beats.map((beat) => (
              <li
                key={beat.step}
                className="rounded-2xl border border-black/8 bg-white p-6 shadow-[0_20px_40px_-28px_rgba(20,20,20,0.35)]"
              >
                <p className="text-xs font-bold tracking-[0.14em] text-[var(--owkin-royal)]">{beat.step}</p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--owkin-ink)]">{beat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{beat.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border border-black/8 bg-[var(--owkin-cream)] p-6 md:p-8">
            <h3 className="text-lg font-semibold text-[var(--owkin-ink)]">Before you start</h3>
            <ul className="mt-4 space-y-2 text-sm leading-relaxed text-steel">
              <li>The demo uses synthetic data — no live patient records.</li>
              <li>
                Clinical safety posture is explained on{" "}
                <Link href="/security" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  Security &amp; safety
                </Link>
                .
              </li>
              <li>
                For FAQ-style answers, see{" "}
                <Link href="/faq" className="font-medium text-navy-dark underline-offset-4 hover:underline">
                  FAQ
                </Link>
                .
              </li>
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/demo/patel" className="owkin-btn-ink text-center sm:min-w-[12rem]">
                Launch Patel demo
              </Link>
              <Link href="/how-it-works" className="owkin-text-cta justify-center sm:justify-start">
                Prefer the product journey diagram
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingCtaBand
        title="Want a guided walkthrough with your team?"
        lede="Request organisation access and we will run the Patel case against your evaluation questions."
        primary={{ label: "Get in touch", href: "/get-started" }}
        secondary={{ label: "Open live demo", href: "/demo/patel" }}
      />
    </MarketingShell>
  );
}
