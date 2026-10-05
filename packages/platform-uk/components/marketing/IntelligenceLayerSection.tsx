import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const capabilities = [
  { label: "Capture", detail: "Voice or notes into structured clinical context.", tone: "mint" },
  { label: "Documentation", detail: "Reviewable drafts with cited evidence.", tone: "sky" },
  { label: "Safety", detail: "Policy and interaction holds before action.", tone: "sand" },
  { label: "Risk", detail: "Signals that need clinician attention.", tone: "mint" },
  { label: "Referral", detail: "Pathway packages for review.", tone: "sky" },
  { label: "Correlation", detail: "Clinical picture assembled for the role.", tone: "sand" },
  { label: "Population", detail: "Governed aggregate intelligence.", tone: "mint" },
  { label: "Governance", detail: "Attributed decisions and audit trail.", tone: "sky" },
] as const;

export default function IntelligenceLayerSection() {
  return (
    <section
      className="owkin-intelligence-layer aksh-intel-med"
      aria-labelledby="intelligence-heading"
      data-section="07b"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="owkin-roles__eyebrow">Specialised intelligence</p>
          <h2 id="intelligence-heading" className="owkin-whats-new__title">
            Intelligence that works behind the workflow.
          </h2>
          <p className="owkin-one-platform__lede mx-auto mt-4">
            Multiple capabilities. One governed workflow — rather than another collection of disconnected AI tools.
          </p>
        </ScrollReveal>

        <div className="aksh-intel-med__grid mt-10">
          {capabilities.map((cap, index) => (
            <ScrollReveal key={cap.label} delayMs={40 + index * 30}>
              <article className={`aksh-intel-med__card aksh-intel-med__card--${cap.tone}`}>
                <p className="aksh-intel-med__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3>{cap.label}</h3>
                <p>{cap.detail}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="aksh-intel-med__footnote mt-8 text-center">
          Powered by specialised Aksh intelligence modules · drafts only · human review required
        </p>
        <div className="mt-4 flex justify-center">
          <Link href="/platform" className="owkin-text-cta">
            Explore platform capabilities
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
