const flowSteps = [
  {
    title: "Patient Discharged",
    detail: "FHIR Encounter created",
  },
  {
    title: "AI Calls Patient",
    detail: "Natural voice conversation (Day 3 post-discharge)",
  },
  {
    title: "Symptoms Collected",
    detail: "Breathing, weight, medication adherence, mood",
  },
  {
    title: "Risk Assessed",
    detail: "Low: monitor / Medium: book review / High: escalate",
  },
  {
    title: "FHIR Updated",
    detail: "Care team notified, task created, care plan updated",
  },
];

const dialogue = [
  {
    speaker: "AI",
    text: "Hello Mrs Johnson, I'm calling from your healthcare team to check on your recovery after your heart failure admission.",
  },
  {
    speaker: "Patient",
    text: "I've been more breathless and my ankles are swollen again.",
  },
  {
    speaker: "AI",
    text: "[Checks FHIR: heart failure history, current medications, previous admissions. Calculates risk: HIGH.]",
  },
  {
    speaker: "AI",
    text: "I'm alerting your care team now. A nurse will call you within the hour.",
  },
  {
    speaker: "Nurse dashboard",
    text: "🔴 URGENT — Mrs Johnson — Readmission risk HIGH",
    urgent: true,
  },
];

export function VoiceAgentDemo() {
  return (
    <section className="bg-navy-dark py-16 text-white lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            AI That Calls Your Patients. Not Just Chats With Them.
          </h2>
          <p className="mt-4 text-slate-300">
            The Voice Care Agent makes outbound calls to patients post-discharge,
            collects structured clinical data, updates FHIR automatically, and
            escalates to the care team when risk is detected.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {flowSteps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 shadow-sm transition-colors hover:bg-white/10">
                <p className="text-xs font-semibold text-accent">
                  Step {index + 1}
                </p>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-slate-300">{step.detail}</p>
              </div>
              {index < flowSteps.length - 1 ? (
                <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-500 lg:block">
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-2xl rounded-lg border border-white/10 bg-white/5 p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-300">
            Example call dialogue
          </p>
          <div className="space-y-3">
            {dialogue.map((line) => (
              <div
                key={line.text}
                className={`rounded-lg px-4 py-3 text-sm ${
                  line.urgent
                    ? "border border-danger/50 bg-danger/20"
                    : line.speaker === "Patient"
                      ? "ml-8 bg-white/10"
                      : "mr-8 bg-primary/40"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  {line.speaker}
                </p>
                <p className="mt-1">{line.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
