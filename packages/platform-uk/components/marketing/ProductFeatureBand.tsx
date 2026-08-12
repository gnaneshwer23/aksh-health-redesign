import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const queueRows = [
  {
    label: "Capture",
    tone: "voice" as const,
    title: "Mr J. Patel",
    meta: "Consult notes · calf swelling · sugars 12–14",
  },
  {
    label: "Documentation",
    tone: "synth" as const,
    title: "SOAP draft ready",
    meta: "Structured note · referral recommendation",
  },
  {
    label: "Risk",
    tone: "oracle" as const,
    title: "Admission risk signal",
    meta: "14-day horizon · awaiting review",
  },
  {
    label: "Audit",
    tone: "shield" as const,
    title: "No auto-writes",
    meta: "Attributed · awaiting Accept",
  },
] as const;

export default function ProductFeatureBand() {
  return (
    <section className="owkin-product-band" aria-labelledby="product-band-heading" data-section="05">
      <div className={`${container} owkin-product-band__grid`}>
        <ScrollReveal className="owkin-product-band__viz" delayMs={40}>
          <div className="owkin-product-card aksh-product-mock">
            <div className="aksh-product-mock__header">
              <div>
                <p className="owkin-product-card__title">Mr J. Patel</p>
                <p className="owkin-product-card__eyebrow">Today 09:40 · Review queue</p>
              </div>
              <span className="aksh-product-mock__pill">Draft</span>
            </div>

            <div className="aksh-product-mock__rows" aria-hidden>
              {queueRows.map((row) => (
                <div key={row.label} className="aksh-product-mock__row">
                  <span className={`aksh-product-mock__agent aksh-product-mock__agent--${row.tone}`}>
                    {row.label}
                  </span>
                  <div>
                    <p>{row.title}</p>
                    <p className="aksh-product-mock__meta">{row.meta}</p>
                  </div>
                  <span className="aksh-product-mock__status aksh-product-mock__status--draft">Draft</span>
                </div>
              ))}
            </div>

            <div className="owkin-product-card__bubble">
              <p>SOAP draft prepared with referral recommendation awaiting clinician review.</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="owkin-product-band__copy" delayMs={80}>
          <p className="owkin-product-band__logo">Review queue</p>
          <h2 id="product-band-heading">One queue. Named clinician approval.</h2>
          <p>
            Documentation, safety checks, and risk signals wait together. Nothing writes to the record until a clinician
            accepts, edits, or rejects.
          </p>
          <div className="owkin-product-band__actions">
            <Link href="/get-started" className="owkin-btn-ink">
              Request access
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
