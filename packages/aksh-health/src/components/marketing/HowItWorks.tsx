export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      color: "bg-sky-500",
      title: "CONNECT",
      sub: "One platform. Every system.",
      body: "Aksh Health connects to your existing EHR via FHIR R4 and HL7 v2. EMIS Web, SystmOne, Epic — no migration project. No rip and replace. The daily extraction job runs at midnight and everything is ready for your morning clinic.",
    },
    {
      num: "02",
      color: "bg-emerald",
      title: "UNDERSTAND",
      sub: "A knowledge graph that reasons.",
      body: "Every patient record becomes a connected intelligence model in Neo4j — conditions linked to risks, medications linked to interactions, history linked to predictions. 12 AI agents run in parallel to generate insights.",
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
      body: "Approved decisions feed back into the knowledge graph. Rejected AI outputs trigger model refinement. The platform gets smarter with every consultation — across every practice in your ICS.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-navy mb-4">
            From Fragmented Data to Coordinated Care in Four Steps
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl p-8 border border-border hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mb-6`}>
                <span className="text-white font-bold text-lg">{step.num}</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-surface text-steel text-xs font-bold uppercase tracking-wider mb-3">
                {step.title}
              </div>
              <h3 className="text-lg font-bold text-navy mb-3">{step.sub}</h3>
              <p className="text-steel text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
