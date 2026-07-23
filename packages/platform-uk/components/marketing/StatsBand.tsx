import { container } from "@/components/marketing/marketing-ui";

const stats = [
  {
    value: "Drafts",
    label: "Structured clinical drafts",
    detail: "Consultations become review-ready clinical documentation",
  },
  {
    value: "Horizon",
    label: "Risk horizon",
    detail: "Surface deterioration signals for clinician attention",
  },
  {
    value: "Review",
    label: "Clinician approval required",
    detail: "Every output waits for Accept, Edit, or Reject",
  },
  {
    value: "Roles",
    label: "Role specific workspaces",
    detail: "Purpose-built views for GP, nurse, pharmacist, and more",
  },
] as const;

export default function StatsBand() {
  return (
    <section
      className="marketing-stats-editorial border-y border-navy/[0.08] bg-white/70 py-14 md:py-16"
      aria-label="Platform capabilities at a glance"
    >
      <div className={container}>
        <div className="marketing-stats-editorial__grid">
          {stats.map((stat) => (
            <div key={stat.label} className="marketing-stats-editorial__item">
              <p className="marketing-stats-editorial__value">{stat.value}</p>
              <p className="marketing-stats-editorial__label">{stat.label}</p>
              <p className="marketing-stats-editorial__detail">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
