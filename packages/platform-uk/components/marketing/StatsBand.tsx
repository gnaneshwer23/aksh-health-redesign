const stats = [
  { value: "8", label: "Role-specific dashboards", detail: "GP, nurse, pharmacist, and more" },
  { value: "12", label: "Specialist AI agents", detail: "Clinical, safety, and operational" },
  { value: "HITL", label: "Human-in-the-loop always", detail: "Accept, Edit, or Reject every draft" },
  { value: "FHIR R4", label: "Ready staging layer", detail: "Draft resources before record write" },
] as const;

export default function StatsBand() {
  return (
    <section className="relative z-10 bg-white py-16 md:py-20" aria-label="Platform capabilities at a glance">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="marketing-stat-card group rounded-2xl border border-border-subtle bg-white p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover"
            >
              <p className="text-3xl font-bold tracking-tight text-navy md:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold text-slate">{stat.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-steel">{stat.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
