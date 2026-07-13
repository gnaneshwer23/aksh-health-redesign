import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function ProductFeatureBand() {
  return (
    <section className="owkin-product-band" aria-labelledby="product-band-heading">
      <div className={`${container} owkin-product-band__grid`}>
        <ScrollReveal className="owkin-product-band__viz" delayMs={60}>
          <div className="owkin-product-card">
            <p className="owkin-product-card__eyebrow">Agent throughput · this week</p>
            <p className="owkin-product-card__title">Review queue activity</p>
            <div className="owkin-product-card__chart" aria-hidden>
              {[42, 58, 51, 67, 74, 33, 28].map((value, index) => (
                <div key={index} className="owkin-product-card__bar" style={{ height: `${value}%` }} />
              ))}
            </div>
            <div className="owkin-product-card__bubble">
              <p>
                Draft a SOAP note for today&apos;s COPD review, stage FHIR Condition, and hold for GP approval.
              </p>
              <div className="owkin-product-card__bubble-bar" aria-hidden />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="owkin-product-band__copy" delayMs={140}>
          <p className="owkin-product-band__logo">AKSH PLATFORM</p>
          <h2 id="product-band-heading">Get governed drafts in minutes, instead of hours.</h2>
          <p>
            Specialist agents draft clinical work from live context. Clinicians stay in the loop — accept, edit, or
            reject — before anything reaches the record.
          </p>
          <div className="owkin-product-band__actions">
            <Link href="/platform" className="owkin-btn-ink">
              Discover the platform
            </Link>
            <Link href="/demo/patel" className="owkin-text-cta">
              Book a walkthrough with our team
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
