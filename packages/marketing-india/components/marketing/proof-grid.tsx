import type { ProofCard, SectionBlock } from "@/content/india-marketing";

export function ProofGrid({
  sections,
  cards,
}: {
  sections: SectionBlock[];
  cards: ProofCard[];
}) {
  return (
    <>
      {sections.map((section) => (
        <section className="product-section product-section--soft" key={section.title}>
          <div className="product-section-head">
            <p className="product-kicker">{section.kicker}</p>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </div>
        </section>
      ))}
      <section className="product-section" aria-label="Proof highlights">
        <div className="product-proof-grid">
          {cards.map((card) => (
            <article className="product-proof-card" key={card.title}>
              {card.tag ? <span>{card.tag}</span> : null}
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
