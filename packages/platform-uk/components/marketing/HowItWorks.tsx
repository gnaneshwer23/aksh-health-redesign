export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      color: "bg-sky-700",
      title: "CONNECT",
      sub: "One platform. Every system.",
      body: "Designed to integrate with EMIS Web and SystmOne via FHIR R4 and HL7 v2. No migration project and no rip-and-replace. Current demo uses synthetic patient data; production integration paths are on the roadmap.",
    },
    {
      num: "02",
      color: "bg-emerald",
      title: "UNDERSTAND",
      sub: "A knowledge graph that reasons.",
      body: "Each patient record becomes a connected model in Neo4j: conditions linked to risks, medications to interactions, history to predictions. Twelve specialist agents run in parallel to surface insights.",
    },
    {
      num: "03",
      color: "bg-navy",
      title: "ACT",
      sub: "Seven AI agents. One review queue.",
      body: "SYNTHESIS writes your SOAP note. DrASSIST codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a Draft in your Review Queue. Nothing writes to the FHIR record until you click Accept.",
    },
    {
      num: "04",
      color: "bg-purple-600",
      title: "LEARN",
      sub: "Every outcome improves the system.",
      body: "Approved decisions feed back into the knowledge graph. Rejected outputs inform model refinement. The platform improves with every consultation across practices in your ICS.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-navy">
            From Fragmented Data to Coordinated Care in Four Steps
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="rounded-2xl border border-border bg-white p-8 transition-shadow hover:shadow-md"
            >
              <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                <span className="text-lg font-bold text-white">{step.num}</span>
              </div>
              <div className="mb-3 inline-block rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-steel">
                {step.title}
              </div>
              <h3 className="mb-3 text-lg font-bold text-navy">{step.sub}</h3>
              <p className="text-sm leading-relaxed text-steel">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
