import { container } from "@/components/marketing/marketing-ui";

const stats = [
  { value: "4 sec", label: "SOAP note draft", detail: "SYNTHESIS structures your note from consultation input" },
  { value: "14 days", label: "Admission risk horizon", detail: "HORIZON predicts deterioration ahead of time" },
  { value: "0", label: "Auto-writes without approval", detail: "Every output waits for clinician sign-off" },
  { value: "8", label: "Role dashboards, one platform", detail: "GP, nurse, pharmacist, and more" },
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
