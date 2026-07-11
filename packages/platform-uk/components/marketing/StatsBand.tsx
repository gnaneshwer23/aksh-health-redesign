import { container } from "@/components/marketing/marketing-ui";
import { PastelStatChip, pastelVariantAt } from "@/components/marketing/PastelCapabilityCard";

const stats = [
  { value: "4 sec", label: "SOAP note draft", detail: "SYNTHESIS structures your note from consultation input" },
  { value: "14 days", label: "Admission risk horizon", detail: "ORACLE predicts deterioration ahead of time" },
  { value: "0", label: "Auto-writes without approval", detail: "Every output waits for clinician sign-off" },
  { value: "8", label: "Role dashboards, one platform", detail: "GP, nurse, pharmacist, and more" },
] as const;

export default function StatsBand() {
  return (
    <section className="relative z-10 border-y border-border-subtle bg-white py-12 md:py-14" aria-label="Platform capabilities at a glance">
      <div className={container}>
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
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
