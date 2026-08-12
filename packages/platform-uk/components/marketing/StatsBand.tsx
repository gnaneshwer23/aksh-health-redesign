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
    detail: "Approved outputs stage to EMIS Web or SystmOne.",
  },
] as const;

export default function StatsBand() {
  return (
    <section
      className="marketing-stats-editorial border-y border-navy/[0.08] bg-white/70"
      aria-label="How it works"
      data-section="06"
    >
      <div className={container}>
        <p className="marketing-section-label mb-6 text-center">How it works</p>
        <div className="marketing-stats-editorial__grid">
          {pillars.map((pillar) => (
            <div key={pillar.label} className="marketing-stats-editorial__item">
              <p className="marketing-stats-editorial__value">{pillar.label}</p>
              <p className="marketing-stats-editorial__label">{pillar.title}</p>
              <p className="marketing-stats-editorial__detail">{pillar.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
