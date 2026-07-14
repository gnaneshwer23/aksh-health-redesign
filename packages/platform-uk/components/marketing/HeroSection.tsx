import Link from "next/link";

import { HeroProductVisual } from "@/components/marketing/OwkinVisuals";
import TrustStrip from "@/components/marketing/TrustStrip";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex min-h-[min(100svh,52rem)] flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-1 flex-col justify-center ${container} pb-4 pt-24 md:pt-28`}>
        <div className="owkin-hero__copy mx-auto max-w-4xl text-center">
          <p className="owkin-hero__brand">Aksh Health</p>
          <h1 className="owkin-hero__title">
            Clinical workflows,
            <span className="block">one platform.</span>
          </h1>
          <p className="owkin-hero__lede">
            Care coordination for EMIS Web and SystmOne. Draft notes, clinical checks, and audit trails —
            clinicians approve before anything reaches the record.
          </p>
          <div className="owkin-hero__actions">
            <Link href="/signup" className="owkin-btn-ink">
              Create account
            </Link>
            <Link href="/walkthrough" className="owkin-text-cta">
              See it in action
              <span aria-hidden>→</span>
            </Link>
            <Link href="/get-started" className="owkin-text-cta">
              Talk to us
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
