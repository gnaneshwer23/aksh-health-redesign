import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const capabilities = [
  { label: "Capture", detail: "Voice or notes into structured clinical context." },
  { label: "Documentation", detail: "Reviewable drafts with cited evidence." },
  { label: "Safety", detail: "Policy and interaction holds before action." },
  { label: "Risk", detail: "Signals that need clinician attention." },
  { label: "Referral", detail: "Pathway packages for review." },
  { label: "Correlation", detail: "Clinical picture assembled for the role." },
  { label: "Population", detail: "Governed aggregate intelligence." },
  { label: "Governance", detail: "Attributed decisions and audit trail." },
] as const;

export default function IntelligenceLayerSection() {
  return (
    <section
      className="owkin-intelligence-layer"
      aria-labelledby="intelligence-heading"
      data-section="07b"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal>
          <p className="owkin-roles__eyebrow owkin-roles__eyebrow--on-dark">Specialised intelligence</p>
          <h2 id="intelligence-heading" className="owkin-intelligence-layer__title">
            Intelligence that works behind the workflow.
          </h2>
          <p className="owkin-intelligence-layer__lede">
            Multiple capabilities. One governed workflow — rather than another collection of disconnected AI tools.
          </p>
        </ScrollReveal>

        <div className="owkin-intelligence-layer__grid mt-10">
          {capabilities.map((cap, index) => (
            <ScrollReveal key={cap.label} delayMs={40 + index * 30}>
              <article className="owkin-intelligence-layer__card">
                <p className="owkin-intelligence-layer__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3>{cap.label}</h3>
                <p>{cap.detail}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="owkin-intelligence-layer__footnote mt-8">
          Powered by specialised Aksh intelligence modules · drafts only · human review required
        </p>
        <Link href="/platform" className="owkin-text-cta owkin-text-cta--on-dark mt-4 inline-flex">
          Explore platform capabilities
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
