import Link from "next/link";

import { InteroperabilityDiagram } from "@/components/marketing/InteroperabilityDiagram";
import TrustStrip from "@/components/marketing/TrustStrip";
import { container } from "@/components/marketing/marketing-ui";

const floatingSignals = [
  { label: "Human review", detail: "Named clinician decides" },
  { label: "Audit trail", detail: "Every decision attributed" },
  { label: "FHIR staging", detail: "Not a live EHR write" },
] as const;

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero aksh-hero-med relative flex flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-col ${container} pb-8 pt-20 md:pb-10 md:pt-24`}>
        <div className="owkin-hero__grid">
          <div className="owkin-hero__copy">
            <p className="owkin-hero__eyebrow">Clinical intelligence platform</p>
            <h1 className="owkin-hero__heading">
              <span className="owkin-hero__brand">Aksh Health</span>
              <span className="owkin-hero__title">
                Clinical intelligence,
                <span className="block">under clinical control.</span>
              </span>
            </h1>
            <p className="owkin-hero__product">Diabetes care, properly coordinated.</p>
            <p className="owkin-hero__lede">
              AI-assisted clinical workflows that help teams capture, understand, review and coordinate care — while
              keeping clinical decisions with clinicians.
            </p>
            <div className="owkin-hero__actions">
              <Link href="/get-started" className="owkin-btn-ink">
                Request a Pilot
              </Link>
              <Link href="/platform" className="aksh-btn-soft">
                Explore the Platform
              </Link>
            </div>
            <p className="owkin-hero__signature">
              AI assists. Clinicians decide. Every decision is attributable.
            </p>
          </div>

          <div className="owkin-hero__visual aksh-hero-visual-stage">
            <div className="aksh-hero-visual-stage__frame">
              <InteroperabilityDiagram className="aksh-interop-diagram--plane" />
            </div>
            <ul className="aksh-hero-float-chips" aria-label="Trust signals">
              {floatingSignals.map((signal) => (
                <li key={signal.label} className="aksh-hero-float-chip">
                  <span className="aksh-hero-float-chip__dot" aria-hidden />
                  <span>
                    <strong>{signal.label}</strong>
                    <em>{signal.detail}</em>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <TrustStrip variant="hero" />
      </div>
    </section>
  );
}
