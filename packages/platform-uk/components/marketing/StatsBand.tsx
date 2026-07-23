import { container } from "@/components/marketing/marketing-ui";

const pillars = [
  {
    label: "Capture",
    title: "Structured from voice or text",
    detail: "Consultation input — typed or dictated — becomes a structured clinical draft in seconds.",
  },
  {
    label: "Review",
    title: "One queue for every output",
    detail:
      "Documentation, safety checks, and risk signals appear together. Accept, edit, or reject each one individually.",
  },
  {
    label: "Govern",
    title: "Every decision attributed and recorded",
    detail: "An immutable audit record is created on every clinician action. Exportable. Cannot be modified.",
  },
  {
    label: "Integrate",
    title: "Staged to your existing systems",
    detail:
      "Approved outputs are structured as FHIR R4 resources and staged to EMIS Web or SystmOne on clinician confirmation.",
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
