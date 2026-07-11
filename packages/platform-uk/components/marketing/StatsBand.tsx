import { PastelStatChip, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";

const stats = [
  { value: "8", label: "Role-specific dashboards", detail: "GP, nurse, pharmacist, and more" },
  { value: "12", label: "Specialist AI agents", detail: "Clinical, safety, and operational" },
  { value: "HITL", label: "Human-in-the-loop always", detail: "Accept, Edit, or Reject every draft" },
  { value: "FHIR R4", label: "Ready staging layer", detail: "Draft resources before record write" },
] as const;

export default function StatsBand() {
  return (
    <section className="relative z-10 border-y border-border-subtle bg-white py-12 md:py-14" aria-label="Platform capabilities at a glance">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <PastelStatChip
              key={stat.label}
              variant={pastelVariantAt(index)}
              value={stat.value}
              label={stat.label}
              detail={stat.detail}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
