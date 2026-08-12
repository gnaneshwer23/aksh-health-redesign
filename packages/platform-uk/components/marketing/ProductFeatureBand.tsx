import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const queueRows = [
  {
    agent: "CANVAS",
    tone: "voice" as const,
    title: "Mr J. Patel",
    meta: "Consult transcript · calf swelling · sugars 12–14",
    summary: "Voice consult captured — structured intake awaiting review.",
  },
  {
    agent: "SYNTHESIS",
    tone: "synth" as const,
    title: "SOAP draft ready",
    meta: "DocumentReference · referral recommendation",
    summary: "SOAP draft prepared with referral recommendation awaiting clinician review.",
  },
  {
    agent: "HORIZON",
    tone: "oracle" as const,
    title: "Admission risk signal",
    meta: "14-day horizon · score 82",
    summary: "Risk score 82 surfaced for same-day clinician attention.",
  },
  {
    agent: "SHIELD",
    tone: "shield" as const,
    title: "Audit trail · no auto-writes",
    meta: "Overnight sync · attributed",
    summary: "Every staging action logged — nothing written without Accept.",
  },
] as const;

export default function ProductFeatureBand() {
  return (
    <section className="owkin-product-band" aria-labelledby="product-band-heading" data-section="05">
      <div className={`${container} owkin-product-band__grid`}>
        <ScrollReveal className="owkin-product-band__viz" delayMs={60}>
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
                <div key={row.agent} className="aksh-product-mock__row">
                  <span className={`aksh-product-mock__agent aksh-product-mock__agent--${row.tone}`}>
                    {row.agent}
                  </span>
                  <div>
                    <p>{row.title}</p>
                    <p className="aksh-product-mock__meta">{row.meta}</p>
                  </div>
                  <span className="aksh-product-mock__status aksh-product-mock__status--draft">Draft</span>
                </div>
              ))}
            </div>

            <div className="aksh-product-mock__panels" aria-hidden>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">HORIZON</p>
                <p className="aksh-product-mock__mini-value">82</p>
                <p className="aksh-product-mock__mini-meta">Risk score</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">SHIELD</p>
                <p className="aksh-product-mock__mini-value aksh-product-mock__mini-value--ok">Clear</p>
                <p className="aksh-product-mock__mini-meta">No auto-write</p>
              </div>
              <div className="aksh-product-mock__mini">
                <p className="aksh-product-mock__mini-label">CANVAS</p>
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
          <p>Documentation, safety checks, and risk signals wait together. Nothing writes until a clinician decides.</p>
          <div className="owkin-product-band__actions">
            <Link href="/get-started" className="owkin-btn-ink">
              Get started
            </Link>
            <Link href="/demo/patel" className="owkin-text-cta">
              See the demo
              <span aria-hidden>→</span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
