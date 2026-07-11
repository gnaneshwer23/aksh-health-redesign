export default function ProblemSection() {
  const cols = [
    {
      label: "Today",
      border: "border-danger/30",
      bg: "bg-danger/5",
      labelColor: "text-danger",
      icon: "✕",
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
      border: "border-warning/30",
      bg: "bg-warning/5",
      labelColor: "text-warning",
      icon: "?",
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
      border: "border-emerald/30",
      bg: "bg-emerald/5",
      labelColor: "text-emerald",
      icon: "✓",
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
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-navy">
            Healthcare Has Invested Trillions in Systems That Store Data.
          </h2>
          <p className="text-xl text-steel">None of them understand it.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cols.map((col) => (
            <div key={col.label} className={`rounded-2xl border-2 ${col.border} ${col.bg} p-8`}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${col.iconBg} ${col.labelColor}`}
                >
                  {col.icon}
                </div>
                <h3 className={`text-xl font-bold ${col.labelColor}`}>{col.label}</h3>
              </div>
              <ul className="space-y-3">
                {col.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-slate">
                    <span className="mt-0.5 shrink-0">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
