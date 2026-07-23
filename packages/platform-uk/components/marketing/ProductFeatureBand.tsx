import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function ProductFeatureBand() {
  return (
    <section className="owkin-product-band" aria-labelledby="product-band-heading">
      <div className={`${container} owkin-product-band__grid`}>
        <ScrollReveal className="owkin-product-band__viz" delayMs={60}>
          <div className="owkin-product-card aksh-product-mock">
            <div className="aksh-product-mock__header">
              <p className="owkin-product-card__eyebrow">GP dashboard · Patel practice</p>
              <span className="aksh-product-mock__pill">Needs Review</span>
            </div>
            <p className="owkin-product-card__title">Today&apos;s review queue</p>

            <div className="aksh-product-mock__rows" aria-hidden>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--voice">CAP</span>
                <div>
                  <p>Consult transcript · Mr J. Patel</p>
                  <p className="aksh-product-mock__meta">Calf swelling · sugars 12–14</p>
                </div>
                <span className="aksh-product-mock__status">In progress</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--synth">SOAP</span>
                <div>
                  <p>SOAP draft ready</p>
                  <p className="aksh-product-mock__meta">DocumentReference · Needs Review</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--draft">Draft</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--oracle">RISK</span>
                <div>
                  <p>Admission risk signal</p>
                  <p className="aksh-product-mock__meta">Risk horizon · Requires attention</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--risk">Review</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--shield">AUDIT</span>
                <div>
                  <p>Audit trail · no auto-writes</p>
                  <p className="aksh-product-mock__meta">Overnight sync · Verified</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--ok">Clear</span>
              </div>
            </div>

            <div className="aksh-product-mock__panels" aria-hidden>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">Risk</p>
                <p className="aksh-product-mock__mini-value">Attention</p>
                <p className="aksh-product-mock__mini-meta">Horizon</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">Audit</p>
                <p className="aksh-product-mock__mini-value aksh-product-mock__mini-value--ok">Verified</p>
                <p className="aksh-product-mock__mini-meta">Governance</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">Capture</p>
                <p className="aksh-product-mock__mini-value aksh-product-mock__mini-value--voice">Active</p>
                <p className="aksh-product-mock__mini-meta">Consult</p>
              </div>
            </div>

            <div className="owkin-product-card__bubble">
              <p>SOAP draft prepared with referral recommendation awaiting clinician review.</p>
              <div className="owkin-product-card__bubble-bar" aria-hidden />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="owkin-product-band__copy" delayMs={140}>
          <p className="owkin-product-band__logo">Aksh platform</p>
          <h2 id="product-band-heading">Capture → draft → approve, in one queue.</h2>
          <p>
            Consultations, risk signals, referrals, and pharmacist checks land as drafts. Clinicians Accept, Edit, or
            Reject before anything reaches the record.
          </p>
          <div className="owkin-product-band__actions">
            <Link href="/signup" className="owkin-btn-ink">
              Create account
            </Link>
            <Link href="/walkthrough" className="owkin-text-cta">
              Book a walkthrough
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
