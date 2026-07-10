const steps = [
  {
    id: "connect",
    label: "CONNECT",
    headline: "One platform. Every system.",
    body: "Aksh Health connects to your existing EHR (EMIS Web, SystmOne, Epic) via FHIR R4 and HL7 v2. No rip and replace. No migration project.",
    accent: "border-sky-400 bg-sky-50",
    visual: (
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="rounded-sm bg-white px-2 py-1 shadow-sm">EMIS</span>
        <span>→</span>
        <span className="rounded-sm bg-white px-2 py-1 shadow-sm">Mirth Connect</span>
        <span>→</span>
        <span className="rounded-sm bg-white px-2 py-1 shadow-sm">FHIR</span>
        <span>→</span>
        <span className="rounded-sm bg-primary px-2 py-1 text-white shadow-sm">Aksh</span>
      </div>
    ),
  },
  {
    id: "understand",
    label: "UNDERSTAND",
    headline: "A knowledge graph that reasons.",
    body: "Every patient record becomes a connected intelligence model — conditions linked to risks, medications linked to interactions, history linked to predictions. Neo4j knowledge graph + John Snow Labs clinical NLP.",
    accent: "border-accent bg-accent/5",
    visual: (
      <div className="relative h-24 w-full">
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary" />
        <div className="absolute left-4 top-4 h-5 w-5 rounded-full border-2 border-secondary bg-white" />
        <div className="absolute right-4 top-6 h-5 w-5 rounded-full border-2 border-secondary bg-white" />
        <div className="absolute bottom-4 left-8 h-5 w-5 rounded-full border-2 border-secondary bg-white" />
        <div className="absolute bottom-2 right-10 h-5 w-5 rounded-full border-2 border-secondary bg-white" />
        <div className="absolute left-[calc(50%-1px)] top-[calc(50%-20px)] h-10 w-0.5 bg-secondary/40" />
        <div className="absolute left-[calc(50%+12px)] top-[calc(50%-8px)] h-0.5 w-16 rotate-[-25deg] bg-secondary/40" />
        <div className="absolute left-[calc(50%-48px)] top-[calc(50%+4px)] h-0.5 w-14 rotate-[35deg] bg-secondary/40" />
      </div>
    ),
  },
  {
    id: "act",
    label: "ACT",
    headline: "Seven AI agents. One review queue.",
    body: "SYNTHESIS writes your SOAP note. DrASSIST codes your diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Nothing writes to the record until you approve it.",
    accent: "border-primary bg-primary/5",
    visual: (
      <div className="space-y-2 text-xs">
        {[
          "SOAP Note Draft — Accept / Edit / Reject",
          "Risk Assessment — Accept / Edit / Reject",
          "Medication Alert — Accept / Edit / Reject",
        ].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-sm border border-border bg-white px-3 py-2"
          >
            <span>{item}</span>
            <span className="text-accent">● ● ●</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "learn",
    label: "LEARN",
    headline: "Every outcome improves the system.",
    body: "Approved decisions feed back into the knowledge graph. Rejected AI outputs trigger model refinement. The platform gets smarter with every consultation — across every practice in your ICS.",
    accent: "border-layer-purple bg-purple-50",
    visual: (
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-layer-purple/30">
        <div className="text-center text-xs font-semibold text-layer-purple">
          Feedback
          <br />
          Loop
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-card py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          From Fragmented Data to Coordinated Care in Four Steps
        </h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`rounded-lg border-l-4 p-5 shadow-sm ${step.accent}`}
            >
              <p className="text-xs font-bold tracking-widest text-muted">
                {step.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{step.headline}</h3>
              <p className="mt-2 text-sm text-muted">{step.body}</p>
              <div className="mt-4">{step.visual}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
