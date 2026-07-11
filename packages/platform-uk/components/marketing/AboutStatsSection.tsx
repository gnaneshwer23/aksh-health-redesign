import { CheckCircle2, FileStack, ShieldCheck } from "lucide-react";

const previewPanels = [
  {
    label: "Human review, every time",
    body: "Every agent output lands in a review queue. Clinicians accept, edit, or reject before anything reaches the record.",
    icon: ShieldCheck,
    tone: "bg-navy/10 text-navy",
  },
  {
    label: "FHIR R4 staging",
    body: "Approved outputs stage as FHIR resources with an immutable audit trail, ready for EMIS Web and SystmOne.",
    icon: FileStack,
    tone: "bg-emerald/10 text-emerald",
  },
] as const;

export default function AboutStatsSection() {
  return (
    <section className="marketing-soft-surface py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <p className="marketing-section-label mb-3">Our platform</p>
            <h2 className="max-w-lg text-3xl font-bold leading-[1.15] tracking-tight text-navy md:text-4xl">
              Built for every stage of clinical care
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-steel">
              One platform standing beside your clinical team: specialist agents draft, check, and coordinate, while
              clinicians stay in control of every decision that reaches the record.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Designed for EMIS Web and SystmOne integration paths",
                "Twelve specialist agents covering clinical, safety, and operational work",
                "Nothing writes to the record without clinician approval",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            {previewPanels.map((panel) => {
              const Icon = panel.icon;
              return (
                <div
                  key={panel.label}
                  className="marketing-pastel-card overflow-hidden rounded-2xl border border-border-subtle bg-white"
                >
                  <div className="flex items-start gap-4 p-6">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${panel.tone}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">{panel.label}</p>
                      <p className="mt-1.5 text-sm leading-relaxed text-steel">{panel.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
