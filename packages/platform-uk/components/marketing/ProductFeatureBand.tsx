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
              <span className="aksh-product-mock__pill">Named review</span>
            </div>
            <p className="owkin-product-card__title">Today&apos;s clinical queue</p>

            <div className="aksh-product-mock__rows" aria-hidden>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--voice">VOICE</span>
                <div>
                  <p>Consult transcript · Mr J. Patel</p>
                  <p className="aksh-product-mock__meta">Calf swelling · sugars 12–14 · SYNTHESIS path</p>
                </div>
                <span className="aksh-product-mock__status">Live</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--synth">SOAP</span>
                <div>
                  <p>SYNTHESIS draft ready</p>
                  <p className="aksh-product-mock__meta">DocumentReference · awaiting GP</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--draft">Draft</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--oracle">ORACLE</span>
                <div>
                  <p>Admission risk 78 → 82</p>
                  <p className="aksh-product-mock__meta">14-day horizon · HIGH</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--risk">Review</span>
              </div>
              <div className="aksh-product-mock__row">
                <span className="aksh-product-mock__agent aksh-product-mock__agent--shield">SHIELD</span>
                <div>
                  <p>AuditEvent · zero auto-writes</p>
                  <p className="aksh-product-mock__meta">Midnight ETL · SUCCESS 6m 39s</p>
                </div>
                <span className="aksh-product-mock__status aksh-product-mock__status--ok">Clear</span>
              </div>
            </div>

            <div className="aksh-product-mock__panels" aria-hidden>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">ORACLE</p>
                <p className="aksh-product-mock__mini-value">82</p>
                <p className="aksh-product-mock__mini-meta">14-day risk</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">SHIELD</p>
                <p className="aksh-product-mock__mini-value aksh-product-mock__mini-value--ok">0</p>
                <p className="aksh-product-mock__mini-meta">Auto-writes</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">VOICE</p>
                <p className="aksh-product-mock__mini-value aksh-product-mock__mini-value--voice">Live</p>
                <p className="aksh-product-mock__mini-meta">Consult capture</p>
              </div>
            </div>

            <div className="owkin-product-card__bubble">
              <p>
                Draft SOAP + urgent DVT duplex referral, stage FHIR Condition &amp; ServiceRequest, hold for GP
                approval.
              </p>
              <div className="owkin-product-card__bubble-bar" aria-hidden />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="owkin-product-band__copy" delayMs={140}>
          <p className="owkin-product-band__logo">AKSH PLATFORM</p>
          <h2 id="product-band-heading">Get governed drafts in minutes, instead of hours.</h2>
          <p>
            Voice consults, risk scores, referrals, and pharmacist checks land in one review queue. Clinicians accept,
            edit, or reject before anything reaches the record.
          </p>
          <div className="owkin-product-band__actions">
            <Link href="/platform" className="owkin-btn-ink">
              Discover the platform
            </Link>
            <Link href="/walkthrough" className="owkin-text-cta">
              Walk the Patel case
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
