import { ClipboardList, FileCheck2, ShieldCheck, UserCheck } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: ClipboardList,
    title: "Clinical intake",
    body: "Consultation notes, vitals, and history flow in from EMIS Web or SystmOne, ready for the knowledge graph.",
  },
  {
    num: "02",
    icon: FileCheck2,
    title: "Agent drafts",
    body: "Specialist agents draft SOAP notes, safety checks, and risk scores in parallel, each scoped to its role.",
  },
  {
    num: "03",
    icon: UserCheck,
    title: "HITL review",
    body: "Every draft lands in the clinician's review queue. Accept, edit, or reject; nothing proceeds unseen.",
  },
  {
    num: "04",
    icon: ShieldCheck,
    title: "FHIR staging",
    body: "Approved outputs stage as FHIR R4 resources with a full audit trail, ready for the record.",
  },
] as const;

export default function ProcessStepsSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-24">
      <div
        className="absolute inset-x-0 top-1/2 -z-10 h-56 -translate-y-1/2 bg-gradient-to-r from-navy/[0.04] via-emerald/[0.05] to-navy/[0.04]"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="marketing-section-label mb-3">The journey</p>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">Start your clinical workflow</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="marketing-pastel-card rounded-2xl border border-border-subtle bg-white p-7 shadow-lg shadow-navy/5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/[0.06] text-navy">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-sm font-bold text-steel/60">{step.num}</span>
                </div>
                <h3 className="mb-2 text-base font-semibold text-navy">{step.title}</h3>
                <p className="text-sm leading-relaxed text-steel">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
