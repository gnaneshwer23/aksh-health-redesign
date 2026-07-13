import Link from "next/link";

import { PlatformHubVisual } from "@/components/marketing/OwkinVisuals";
import TrustStrip from "@/components/marketing/TrustStrip";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex min-h-[100svh] flex-col overflow-hidden">
      <div className="owkin-hero__atmosphere" aria-hidden>
        <PlatformHubVisual className="owkin-hero__orb" idPrefix="hero" />
      </div>

      <div className={`relative z-10 flex flex-1 flex-col justify-center ${container} pb-10 pt-28 md:pt-32`}>
        <div className="owkin-hero__copy mx-auto max-w-4xl text-center">
          <p className="owkin-hero__brand">Aksh Health</p>
          <h1 className="owkin-hero__title">
            Clinical workflows,
            <span className="block">one platform.</span>
          </h1>
          <p className="owkin-hero__lede">
            FHIR-ready care coordination for EMIS Web and SystmOne. Specialist agents draft, check, and escalate —
            clinicians approve before anything reaches the record.
          </p>
          <div className="owkin-hero__actions">
            <Link href="/signup" className="owkin-btn-ink">
              Create account
            </Link>
            <Link href="/get-started" className="owkin-text-cta">
              Request organisation access
              <span aria-hidden>→</span>
            </Link>
            <Link href="/demo/patel" className="owkin-text-cta">
              See it in action
              <span aria-hidden>→</span>
            </Link>
          </div>
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
