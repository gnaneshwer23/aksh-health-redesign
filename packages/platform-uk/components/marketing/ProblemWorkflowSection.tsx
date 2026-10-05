import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const fragments = [
  { label: "Consultation", tone: "mint" },
  { label: "Notes", tone: "sand" },
  { label: "Medications", tone: "sky" },
  { label: "Labs", tone: "mint" },
  { label: "Risk", tone: "sand" },
  { label: "Referral", tone: "sky" },
  { label: "Follow-up", tone: "mint" },
] as const;

export default function ProblemWorkflowSection() {
  return (
    <section
      className="owkin-problem-workflow aksh-problem-med"
      aria-labelledby="problem-workflow-heading"
      data-section="03"
    >
      <div className={`${container} py-16 md:py-24`}>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="owkin-roles__eyebrow">The clinical workflow</p>
          <h2 id="problem-workflow-heading" className="owkin-whats-new__title">
            Clinical work doesn&apos;t happen in one place.
          </h2>
          <p className="owkin-one-platform__lede mx-auto mt-4">
            Consultations, documentation, medications, evidence, risk signals and referrals create a complex workflow.
            Aksh brings the work together into one coordinated review experience.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={60} className="mt-12">
          <div className="aksh-fragment-flow aksh-fragment-flow--soft" aria-hidden>
            {fragments.map((item, index) => (
              <div key={item.label} className="aksh-fragment-flow__item">
                <span className={`aksh-fragment-flow__card aksh-fragment-flow__card--${item.tone}`}>
                  {item.label}
                </span>
                {index < fragments.length - 1 ? (
                  <span className="aksh-fragment-flow__arrow">→</span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="aksh-fragment-flow__converge mt-10">
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
