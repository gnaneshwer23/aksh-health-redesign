import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const cards = [
  {
    tag: "Context",
    title: "Authorised patient picture",
    detail: "Conditions, medicines, labs, and provenance — assembled for the signed-in role. Not a dump of the whole chart.",
  },
  {
    tag: "Evidence",
    title: "Cited, not invented",
    detail: "Guideline and lab citations sit next to the draft. Missing items such as adherence are listed, not guessed.",
  },
  {
    tag: "Safety",
    title: "Held until a clinician decides",
    detail: "Unsafe or out-of-policy drafts are blocked from the queue. Everything else still needs Accept, Edit, or Reject.",
  },
] as const;

export default function WhatsNewSection() {
  return (
    <section className="owkin-whats-new" aria-labelledby="clinical-picture-heading" data-section="07">
      <div className={container}>
        <ScrollReveal>
          <p className="owkin-roles__eyebrow">In production</p>
          <h2 id="clinical-picture-heading" className="owkin-whats-new__title">
            The clinical picture
            <span className="block">sits with the draft.</span>
          </h2>
          <p className="owkin-one-platform__lede mb-10">
            Diabetes-first coordination for authorised clinics. Region-adaptable later. Sits beside the EHR — never an
            automatic write to the record.
          </p>
        </ScrollReveal>

        <div className="owkin-whats-new__grid">
          {cards.map((card, index) => (
            <ScrollReveal key={card.tag} delayMs={40 + index * 40}>
              <article className="owkin-news-card owkin-news-card--ink">
                <p className="owkin-news-card__tag">{card.tag}</p>
                <h3>{card.title}</h3>
                <p className="owkin-one-platform__lede mt-3 max-w-none">
                  {card.detail}
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
