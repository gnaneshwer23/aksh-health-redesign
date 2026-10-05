import Link from "next/link";

import { InteroperabilityDiagram } from "@/components/marketing/InteroperabilityDiagram";
import TrustStrip from "@/components/marketing/TrustStrip";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-col ${container} pb-6 pt-16 md:pb-8 md:pt-20`}>
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
              <Link href="/platform" className="owkin-text-cta">
                Explore the Platform
                <span aria-hidden>→</span>
              </Link>
            </div>
            <p className="owkin-hero__signature">
              AI assists. Clinicians decide. Every decision is attributable.
            </p>
          </div>

          <div className="owkin-hero__visual">
            <InteroperabilityDiagram className="aksh-interop-diagram--plane" />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <TrustStrip variant="hero" />
      </div>
    </section>
  );
}
