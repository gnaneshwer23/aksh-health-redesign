import type { Testimonial } from "@/content/india-marketing";

export function Testimonials({
  kicker,
  title,
  description,
  items,
}: {
  kicker: string;
  title: string;
  description: string;
  items: Testimonial[];
}) {
  return (
    <section className="product-section product-section--testimonials" aria-labelledby="testimonials-heading">
      <div className="product-section-head product-section-head--center">
        <p className="product-kicker">{kicker}</p>
        <h2 id="testimonials-heading">{title}</h2>
        <p>{description}</p>
      </div>
      <div className="testimonial-grid">
        {items.map((item) => (
          <article className="testimonial-card" key={item.name}>
            <div className="testimonial-card__stars" aria-hidden="true">
              ★★★★★
            </div>
            <p className="testimonial-card__quote">“{item.quote}”</p>
            <div className="testimonial-card__author">
              <span className="testimonial-card__avatar">{item.initials}</span>
              <div>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
