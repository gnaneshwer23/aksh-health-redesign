export default function VoiceAgentSection() {
  const steps = [
    { n: 1, title: "Patient Discharged", detail: "FHIR Encounter resource created on discharge" },
    { n: 2, title: "AI Calls Patient", detail: "Day 3 post-discharge · Natural voice conversation" },
    { n: 3, title: "Symptoms Collected", detail: "Breathing, weight, medication adherence, mood" },
    { n: 4, title: "Risk Assessed", detail: "Low: monitor · Medium: book review · High: escalate" },
    { n: 5, title: "FHIR Updated", detail: "Care team notified · Task created · AuditEvent logged" },
  ];

  return (
    <section className="relative overflow-hidden bg-navy-dark py-20 text-white md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(0_168_107/0.12),transparent_40%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">Voice care</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">AI That Calls Your Patients.</h2>
          <p className="mx-auto max-w-2xl text-xl text-white/70">
            The Voice Care Agent makes outbound calls post-discharge, collects structured clinical data, stages FHIR
            resources for review, and escalates to the care team when risk is detected.
          </p>
        </div>

        <div className="mb-16 flex flex-col items-center justify-center gap-4 md:flex-row">
          {steps.map((step, i) => (
            <div key={step.n} className="flex items-center gap-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald bg-emerald/20">
                  <span className="font-bold text-emerald">{step.n}</span>
                </div>
                <div className="mb-1 text-sm font-semibold text-white">{step.title}</div>
                <div className="max-w-[120px] text-xs text-white/50">{step.detail}</div>
              </div>
              {i < steps.length - 1 && <div className="hidden h-0.5 w-8 shrink-0 bg-white/20 md:block" />}
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-card backdrop-blur-sm">
          <div className="mb-6 text-xs font-bold uppercase tracking-wider text-white/50">
            Example conversation: day 3 post-discharge
          </div>
          {[
            { who: "AI", msg: "Hello Mrs Johnson, I'm calling to check your recovery after your heart failure admission. How are you feeling today?" },
            { who: "Patient", msg: "I've been more breathless and my ankles are swollen again..." },
            { who: "AI", msg: "Thank you for telling me. I'm flagging this to your care team immediately. A nurse will call you within the hour." },
            { who: "System", msg: "URGENT: Mrs Johnson. Readmission risk HIGH. Nurse dashboard notified." },
          ].map((item, i) => (
            <div key={i} className={`flex gap-3 ${item.who === "Patient" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  item.who === "AI"
                    ? "bg-emerald text-white"
                    : item.who === "Patient"
                      ? "bg-white/20 text-white"
                      : "w-full rounded-lg bg-danger/30 px-4 py-2 text-sm text-danger"
                }`}
              >
                {item.who !== "System" && item.who[0]}
              </div>
              {item.who !== "System" && (
                <div
                  className={`max-w-sm rounded-2xl px-4 py-2.5 text-sm ${
                    item.who === "AI" ? "bg-white/10 text-white" : "bg-white/20 text-white"
                  }`}
                >
                  {item.msg}
                </div>
              )}
              {item.who === "System" && (
                <div className="w-full rounded-lg border border-danger/30 bg-danger/20 px-4 py-2 text-sm font-medium text-danger">
                  {item.msg}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
