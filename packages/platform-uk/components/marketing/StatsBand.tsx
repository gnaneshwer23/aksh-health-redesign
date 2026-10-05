import { container } from "@/components/marketing/marketing-ui";

const pillars = [
  {
    label: "Capture",
    title: "Voice or notes",
    detail: "The consult becomes a structured diabetes draft.",
  },
  {
    label: "Review",
    title: "One queue",
    detail: "Documentation, evidence, and safety — together.",
  },
  {
    label: "Govern",
    title: "Named decision",
    detail: "Accept, edit, or reject. Every action is attributed.",
  },
  {
    label: "Integrate",
    title: "FHIR staging",
    detail: "Approved outputs stage as FHIR. Not a live EHR write.",
  },
] as const;

export default function StatsBand() {
  return (
    <section
      className="marketing-stats-editorial aksh-steps-med"
      aria-label="How it works"
      data-section="06"
    >
      <div className={container}>
        <div className="aksh-steps-med__intro">
          <p className="marketing-section-label">How it works</p>
          <h2 className="aksh-steps-med__title">Capture. Review. Govern. Integrate.</h2>
        </div>
        <div className="aksh-steps aksh-steps--cards">
          {pillars.map((pillar, index) => (
            <div key={pillar.label} className="aksh-steps__item aksh-steps__card">
              <p className="aksh-steps__index" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="aksh-steps__label">{pillar.label}</p>
              <p className="aksh-steps__title">{pillar.title}</p>
              <p className="aksh-steps__detail">{pillar.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
