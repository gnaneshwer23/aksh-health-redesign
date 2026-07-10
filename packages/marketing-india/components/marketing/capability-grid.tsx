import type { Capability, SectionBlock } from "@/content/india-marketing";

export function CapabilityGrid({
  section,
  capabilities,
}: {
  section: SectionBlock;
  capabilities: Capability[];
}) {
  return (
    <section className="product-section" aria-labelledby="capabilities-heading">
      <div className="product-section-head">
        <p className="product-kicker">{section.kicker}</p>
        <h2 id="capabilities-heading">{section.title}</h2>
        <p>{section.description}</p>
      </div>
      <div className="product-capability-grid">
        {capabilities.map((capability) => (
          <article className="product-capability-card" key={capability.title}>
            <span className="lp-cap-icon">{capability.icon}</span>
            <h3>{capability.title}</h3>
            <p>{capability.text}</p>
            <ul className="product-bullet-list">
              {capability.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
