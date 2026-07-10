import type { SectionBlock, WorkflowStep } from "@/content/india-marketing";

export function WorkflowSteps({
  section,
  steps,
  id,
}: {
  section: SectionBlock;
  steps: WorkflowStep[];
  id?: string;
}) {
  return (
    <section className="product-section product-section--soft" id={id} aria-labelledby="workflow-heading">
      <div className="product-section-head">
        <p className="product-kicker">{section.kicker}</p>
        <h2 id="workflow-heading">{section.title}</h2>
        <p>{section.description}</p>
      </div>
      <div className={`lp-how-grid${steps.length === 4 ? " lp-how-grid--four" : ""}`}>
        {steps.map((step) => (
          <article className="lp-how-card" key={step.title}>
            <span className="lp-how-step">{step.step}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
