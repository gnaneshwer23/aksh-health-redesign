import Link from "next/link";

import { InteroperabilityDiagram } from "@/components/marketing/InteroperabilityDiagram";
import TrustMarquee from "@/components/marketing/TrustMarquee";
import { container } from "@/components/marketing/marketing-ui";

export default function HeroSection() {
  return (
    <section className="marketing-homepage-hero owkin-hero relative flex flex-col overflow-hidden">
      <div className={`relative z-10 flex flex-col ${container} pb-2 pt-16 md:pb-3 md:pt-20`}>
        <div className="owkin-hero__grid">
          <div className="owkin-hero__copy">
            <p className="owkin-hero__brand">Care coordination for UK primary care</p>
            <h1 className="owkin-hero__title">
              Clinical work,
              <span className="block">properly coordinated.</span>
            </h1>
            <p className="owkin-hero__lede">
              Consultations, medications, referrals, and risk signals — structured, reviewed, and approved by the
              clinician before anything reaches the record.
            </p>
            <div className="owkin-hero__actions">
              <Link href="/get-started" className="owkin-btn-ink">
                Get started
              </Link>
              <Link href="/walkthrough" className="owkin-text-cta">
                Book a walkthrough
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>

          <div className="owkin-hero__visual">
            <InteroperabilityDiagram className="aksh-interop-diagram--plane" />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <TrustMarquee />
      </div>
    </section>
  );
}
