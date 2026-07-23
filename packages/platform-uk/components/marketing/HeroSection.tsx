import Link from "next/link";

import { InteroperabilityDiagram } from "@/components/marketing/InteroperabilityDiagram";
import TrustMarquee from "@/components/marketing/TrustMarquee";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex min-h-[min(100svh,52rem)] flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-1 flex-col justify-center ${container} pb-4 pt-24 md:pt-28`}>
        <div className="owkin-hero__grid">
          <div className="owkin-hero__copy">
            <p className="owkin-hero__wordmark">Aksh Health</p>
            <p className="owkin-hero__brand">Care coordination for NHS primary care</p>
            <h1 className="owkin-hero__title">
              Clinical work.
              <span className="block">Properly coordinated.</span>
            </h1>
            <p className="owkin-hero__lede">
              Capture consultations, prepare structured clinical drafts, and keep every change under clinician control
              across EMIS Web and SystmOne.
            </p>
            <div className="owkin-hero__actions">
              <Link href="/signup" className="owkin-btn-ink">
                Create account
              </Link>
              <Link href="/walkthrough" className="owkin-text-cta">
                Book a walkthrough
                <span aria-hidden>→</span>
              </Link>
              <Link href="/get-started" className="owkin-text-cta">
                Talk to us
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="owkin-hero__visual">
            <InteroperabilityDiagram className="aksh-interop-diagram--plane" />
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <TrustMarquee />
      </div>
    </section>
  );
}
