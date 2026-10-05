import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const queueRows = [
  {
    label: "Risk",
    tone: "oracle" as const,
    title: "J. Patel",
    meta: "Admission risk signal · 14-day horizon",
    status: "HIGH" as const,
  },
  {
    label: "Medication",
    tone: "shield" as const,
    title: "S. Khan",
    meta: "Interaction check · review required",
    status: "HIGH" as const,
  },
  {
    label: "Referral",
    tone: "synth" as const,
    title: "A. Williams",
    meta: "Pathway package staged",
    status: "MEDIUM" as const,
  },
  {
    label: "Note",
    tone: "voice" as const,
    title: "R. Singh",
    meta: "SOAP draft · evidence attached",
    status: "LOW" as const,
  },
] as const;

export default function ProductFeatureBand() {
  return (
    <section className="owkin-product-band" aria-labelledby="product-band-heading" data-section="05">
      <div className={`${container} owkin-product-band__grid`}>
        <ScrollReveal className="owkin-product-band__viz" delayMs={40}>
          <div className="owkin-product-card aksh-product-mock" data-testid="review-queue-mock">
            <div className="aksh-product-mock__chrome" aria-hidden>
              <span /><span /><span />
              <em>akshhealth.com/dashboard</em>
            </div>
            <div className="aksh-product-mock__header">
              <div>
                <p className="owkin-product-card__eyebrow">Good morning, Dr Williams</p>
                <p className="owkin-product-card__title">Review queue</p>
              </div>
              <span className="aksh-product-mock__pill">12 items</span>
            </div>

            <div className="aksh-product-mock__rows" aria-hidden>
              {queueRows.map((row) => (
                <div key={row.title} className="aksh-product-mock__row">
                  <span className={`aksh-product-mock__agent aksh-product-mock__agent--${row.tone}`}>
                    {row.label}
                  </span>
                  <div>
                    <p>{row.title}</p>
                    <p className="aksh-product-mock__meta">{row.meta}</p>
                  </div>
                  <span
                    className={`aksh-product-mock__status aksh-product-mock__status--${row.status.toLowerCase()}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="owkin-product-card__bubble">
              <p>
                Documentation, safety checks and risk signals wait together. Every row is an AI draft until Accept, Edit
                or Reject.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="owkin-product-band__copy" delayMs={80}>
          <p className="owkin-product-band__logo">The clinician workspace</p>
          <h2 id="product-band-heading">One queue. Everything that needs a clinical decision.</h2>
          <p>
            Documentation, cited evidence, and safety holds wait together so clinicians can review them in context.
            Nothing writes to the record until a clinician accepts, edits, or rejects.
          </p>
          <div className="owkin-product-band__actions">
            <Link href="/get-started" className="owkin-btn-ink">
              Request a Pilot
            </Link>
            <Link href="/demo/patel" className="owkin-text-cta">
              Open product walkthrough
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
