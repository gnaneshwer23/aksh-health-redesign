import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const pillars = [
  {
    title: "Human review",
    detail: "Every clinical output requires named review before it can progress.",
  },
  {
    title: "Audit",
    detail: "Who drafted, reviewed and decided is recorded.",
  },
  {
    title: "Clinical safety",
    detail: "Safety controls are developed alongside the product.",
  },
  {
    title: "Data governance",
    detail: "Purpose limitation, minimisation, tenant isolation, encryption and role-based access.",
  },
] as const;

export default function SafetyTrustSection() {
  return (
    <section
      className="owkin-safety-trust"
      aria-labelledby="safety-trust-heading"
      data-section="11"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal>
          <p className="owkin-roles__eyebrow owkin-roles__eyebrow--on-dark">Trust is a gate, not a slogan.</p>
          <h2 id="safety-trust-heading" className="owkin-intelligence-layer__title">
            Designed so governance is part of the workflow.
          </h2>
        </ScrollReveal>

        <div className="owkin-safety-trust__grid mt-10">
          {pillars.map((pillar, index) => (
            <ScrollReveal key={pillar.title} delayMs={40 + index * 40}>
              <article className="owkin-safety-trust__card">
                <p className="owkin-intelligence-layer__index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3>{pillar.title}</h3>
                <p>{pillar.detail}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delayMs={120} className="owkin-honesty-panel mt-12">
          <h3>Built with ambition. Communicated with precision.</h3>
          <p>
            We distinguish clearly between what is live, what is being evaluated and what is on the roadmap. Aksh does
            not claim MHRA certification, completed clinical safety case sign-off, live production EHR write-back, or
            autonomous diagnosis, prescribing or treatment.
          </p>
          <Link href="/security" className="owkin-text-cta owkin-text-cta--on-dark mt-4 inline-flex">
            View our safety posture
            <span aria-hidden>→</span>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
