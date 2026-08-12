import { container } from "@/components/marketing/marketing-ui";

const pillars = [
  {
    label: "Capture",
    title: "Voice or notes",
    detail: "The consult becomes a structured draft.",
  },
  {
    label: "Review",
    title: "One queue",
    detail: "Documentation, safety, and risk — together.",
  },
  {
    label: "Govern",
    title: "Named decision",
    detail: "Accept, edit, or reject. Every action is attributed.",
  },
  {
    label: "Integrate",
    title: "FHIR staging",
    detail: "Approved outputs stage as FHIR for your EHR.",
  },
] as const;

export default function StatsBand() {
  return (
    <section
      className="marketing-stats-editorial border-y border-navy/[0.08] bg-white"
      aria-label="How it works"
      data-section="06"
    >
      <div className={container}>
        <p className="marketing-section-label mb-8 text-left">How it works</p>
        <div className="aksh-steps">
          {pillars.map((pillar, index) => (
            <div key={pillar.label} className="aksh-steps__item">
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
