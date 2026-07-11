import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function ProblemSection() {
  const cols = [
    {
      label: "Today",
      border: "border-danger/25",
      bg: "bg-danger/5",
      labelColor: "text-danger",
      icon: XCircle,
      iconBg: "bg-danger/10",
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
      border: "border-warning/25",
      bg: "bg-warning/5",
      labelColor: "text-warning",
      icon: AlertTriangle,
      iconBg: "bg-warning/10",
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
      border: "border-emerald/25",
      bg: "bg-emerald/5",
      labelColor: "text-emerald",
      icon: CheckCircle2,
      iconBg: "bg-emerald/10",
      points: [
        "Designed for FHIR R4 and HL7 interoperability",
        "12 AI agents reason across unified clinical data",
        "Outputs staged as FHIR drafts for review, not static PDFs",
        "ORACLE surfaces risk scores for clinician review",
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

        <div className="grid gap-6 md:grid-cols-3">
          {cols.map((col) => {
            const Icon = col.icon;
            return (
              <div
                key={col.label}
                className={`marketing-capability-card rounded-2xl border ${col.border} ${col.bg} p-8 shadow-card`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${col.iconBg} ${col.labelColor}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className={`text-xl font-bold ${col.labelColor}`}>{col.label}</h3>
                </div>
                <ul className="space-y-3">
                  {col.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${col.labelColor} bg-current`} />
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
