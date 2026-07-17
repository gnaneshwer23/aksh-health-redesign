import Link from "next/link";

import { HeroProductVisual } from "@/components/marketing/OwkinVisuals";
import TrustStrip from "@/components/marketing/TrustStrip";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex min-h-[min(100svh,52rem)] flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-1 flex-col justify-center ${container} pb-4 pt-24 md:pt-28`}>
        <div className="owkin-hero__copy mx-auto max-w-4xl text-center">
          <p className="owkin-hero__brand">Care coordination for NHS primary care</p>
          <h1 className="owkin-hero__title">
            Clinical work,
            <span className="block">properly coordinated.</span>
          </h1>
          <p className="owkin-hero__lede">
            Bring consult capture, draft notes, clinical checks, and audit trails into one governed workflow for EMIS
            Web and SystmOne — with a clinician deciding what reaches the record.
          </p>
          <div className="owkin-hero__actions">
            <Link href="/get-started" className="owkin-btn-ink">
              Discuss a pilot
            </Link>
            <Link href="/walkthrough" className="owkin-text-cta">
              See it in action
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="owkin-hero__product">
          <HeroProductVisual />
        </div>

        <div className="owkin-hero__scroll" aria-hidden>
          <span className="owkin-hero__scroll-mouse" />
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <TrustStrip variant="hero" />
      </div>
    </section>
  );
}
