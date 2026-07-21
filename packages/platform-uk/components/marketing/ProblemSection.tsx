import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function ProblemSection() {
  const cols = [
    {
      label: "Today",
      accent: "text-steel",
      iconBg: "bg-surface-muted",
      icon: XCircle,
      points: [
        "Patient data lives in 6+ disconnected systems",
        "Clinicians spend 40% of time on admin, not patients",
        "AI tools write PDFs nobody reads",
        "Deterioration detected after the patient collapses",
        "Referrals sent by phone, fax, and email",
      ],
    },
    {
      label: "The Gap",
      accent: "text-steel",
      iconBg: "bg-surface-muted",
      icon: AlertTriangle,
      points: [
        "EHRs, labs, imaging, and pharmacy all exist",
        "But no layer connects and reasons across them",
        "No layer acts on the insights",
        "No layer coordinates the care automatically",
        "No layer writes to the record, not just a PDF",
      ],
    },
    {
      label: "Aksh Health",
      accent: "text-emerald",
      iconBg: "bg-emerald/10",
      icon: CheckCircle2,
      points: [
        "Designed for FHIR R4 and HL7 interoperability",
        "12 AI agents reason across unified clinical data",
        "Outputs staged as FHIR drafts for review, not static PDFs",
        "HORIZON surfaces risk scores for clinician review",
        "GP approves every recommendation before it acts",
      ],
    },
  ];

  return (
    <section className="bg-surface-muted py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="marketing-section-label mb-3">The challenge</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-navy md:text-4xl">
            Healthcare Has Invested Trillions in Systems That Store Data.
          </h2>
          <p className="text-lg text-steel md:text-xl">None of them understand it.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {cols.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.label}
                className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${col.iconBg} ${col.accent}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className={`text-lg font-semibold ${col.accent === "text-emerald" ? "text-emerald" : "text-navy"}`}>
                    {col.label}
                  </h3>
                </div>
                <ul className="space-y-3">
                  {col.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${col.accent}`}
                        aria-hidden
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
