import type { PartnerAudience } from "@/content/india-marketing";

export function PartnerAudienceCards({ audiences }: { audiences: PartnerAudience[] }) {
  return (
    <section className="product-section" aria-label="Partner audiences">
      <div className="partner-grid">
        {audiences.map((audience) => (
          <article className="partner-card" key={audience.audience}>
            <span>{audience.audience}</span>
            <h3>{audience.promise}</h3>
            <p>{audience.detail}</p>
            <ul className="product-bullet-list">
              {audience.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
