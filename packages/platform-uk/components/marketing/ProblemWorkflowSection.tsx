import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const fragments = [
  "Consultation",
  "Notes",
  "Medications",
  "Labs",
  "Risk",
  "Referral",
  "Follow-up",
] as const;

export default function ProblemWorkflowSection() {
  return (
    <section
      className="owkin-problem-workflow border-y border-[var(--mk-line)] bg-[var(--owkin-cream,#fcfcfd)]"
      aria-labelledby="problem-workflow-heading"
      data-section="03"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal>
          <p className="owkin-roles__eyebrow">The clinical workflow</p>
          <h2 id="problem-workflow-heading" className="owkin-whats-new__title max-w-3xl">
            Clinical work doesn&apos;t happen in one place.
          </h2>
          <p className="owkin-one-platform__lede mt-4 max-w-2xl">
            Consultations, documentation, medications, evidence, risk signals and referrals create a complex workflow.
            Aksh brings the work together into one coordinated review experience.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={60} className="mt-10">
          <div className="aksh-fragment-flow" aria-hidden>
            {fragments.map((label, index) => (
              <div key={label} className="aksh-fragment-flow__item">
                <span className="aksh-fragment-flow__card">{label}</span>
                {index < fragments.length - 1 ? (
                  <span className="aksh-fragment-flow__arrow">↓</span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="aksh-fragment-flow__converge mt-8">
            <p className="aksh-fragment-flow__aksh">Aksh Health</p>
            <span className="aksh-fragment-flow__arrow">↓</span>
            <p className="aksh-fragment-flow__queue">One review queue</p>
            <p className="aksh-fragment-flow__note">
              Aksh connects the workflow — without taking clinical control away from the clinician.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
