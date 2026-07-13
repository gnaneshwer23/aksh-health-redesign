import Link from "next/link";

import TrustStrip from "@/components/marketing/TrustStrip";
import { bandPrimaryCta, bandSecondaryCta, container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero relative flex min-h-[100svh] flex-col overflow-hidden bg-navy-dark text-white">
      <div className="marketing-homepage-hero__atmosphere" aria-hidden>
        <div className="marketing-homepage-hero__glow marketing-homepage-hero__glow--emerald" />
        <div className="marketing-homepage-hero__glow marketing-homepage-hero__glow--steel" />
        <div className="marketing-homepage-hero__grid" />
        <div className="marketing-homepage-hero__horizon" />
      </div>

      <div
        className={`relative z-10 flex flex-1 flex-col justify-center ${container} pb-16 pt-28 md:pb-20 md:pt-32`}
      >
        <div className="marketing-homepage-hero__copy mx-auto max-w-4xl text-center">
          <p className="marketing-homepage-hero__brand mb-8 text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Aksh Health
          </p>

          <h1 className="marketing-homepage-hero__title mb-6 text-3xl leading-[1.08] text-white sm:text-4xl md:text-5xl lg:text-[3.5rem]">
            Clinical workflows,
            <span className="block text-accent">one platform.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg md:text-xl">
            FHIR-ready care coordination for EMIS Web and SystmOne. Specialist agents draft, check, and
            escalate — clinicians approve before anything reaches the record.
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/signup" className={`${bandPrimaryCta} sm:min-w-[11rem]`}>
              Create account
            </Link>
            <Link href="/get-started" className={`${bandSecondaryCta} sm:min-w-[11rem]`}>
              Request organisation access
            </Link>
            <Link href="/demo/patel" className={`${bandSecondaryCta} sm:min-w-[11rem]`}>
              See it in action
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <TrustStrip variant="hero" />
      </div>
    </section>
  );
}
