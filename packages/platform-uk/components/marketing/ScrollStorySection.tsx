import Link from "next/link";

import { ProductSceneVisual } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

export default function ScrollStorySection() {
  return (
    <section className="owkin-story" aria-label="Why Aksh Health">
      {/* Section 2 — Problem statement (merged vision) */}
      <div className="owkin-story__scene owkin-story__scene--problem" data-section="02">
        <div className={`${container} owkin-story__split`}>
          <ScrollReveal className="owkin-story__split-copy" delayMs={40}>
            <p className="owkin-story__section-label">The problem</p>
            <h2>
              Clinical work lives
              <span className="block">across too many systems.</span>
            </h2>
            <p>
              A consultation happens in EMIS. A referral goes by email. A medication check requires a separate tool. A
              handover is typed from memory. The information exists — it is just never in one place at the right moment.
            </p>
            <Link href="/platform" className="owkin-text-cta">
              View how it works
              <span aria-hidden>→</span>
            </Link>
          </ScrollReveal>

          <ScrollReveal className="owkin-story__split-visual" delayMs={120}>
            <div className="owkin-story__visual-frame owkin-story__visual-frame--problem">
              <ProductSceneVisual variant="fragmented" />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Section 3 — Coordinated drafts */}
      <div className="owkin-story__scene" data-section="03">
        <div className={`${container} owkin-story__grid`}>
          <ScrollReveal className="owkin-story__headline" delayMs={40}>
            <h2>
              Every consultation becomes a structured draft.
              <span className="block">You decide what reaches the record.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal className="owkin-story__visual" delayMs={120}>
            <div className="owkin-story__visual-frame">
              <ProductSceneVisual variant="voice" />
            </div>
          </ScrollReveal>

          <ScrollReveal className="owkin-story__copy" delayMs={200}>
            <p>
              Voice capture or typed input. Structured documentation, drug safety checks, and risk signals — prepared
              in parallel, surfaced in one queue. Accept, edit, or reject before anything is written.
            </p>
            <Link href="/platform" className="owkin-text-cta">
              View workflow
              <span aria-hidden>→</span>
            </Link>
          </ScrollReveal>
        </div>
      </div>

      {/* Section 4 — FHIR / SHIELD */}
      <div className="owkin-story__scene owkin-story__scene--fhir" data-section="04">
        <div className={`${container} owkin-story__split`}>
          <ScrollReveal className="owkin-story__split-copy" delayMs={40}>
            <p className="owkin-story__section-label">Standards and governance</p>
            <h2>
              Built on FHIR.
              <span className="block">Governed by SHIELD.</span>
            </h2>
            <p>
              Every approved output is structured as a FHIR R4 resource before it reaches the record. Every action —
              acceptance, edit, rejection — is recorded in an immutable audit trail. Nothing is assumed. Everything is
              attributed.
            </p>
            <Link href="/security" className="owkin-text-cta">
              View security and safety
              <span aria-hidden>→</span>
            </Link>
          </ScrollReveal>

          <ScrollReveal className="owkin-story__split-visual" delayMs={120}>
            <div className="owkin-story__visual-frame">
              <ProductSceneVisual variant="fhir" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
