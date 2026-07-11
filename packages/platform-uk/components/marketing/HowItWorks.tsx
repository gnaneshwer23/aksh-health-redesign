import { Brain, Link2, ShieldCheck, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      color: "bg-navy",
      icon: Link2,
      title: "CONNECT",
      sub: "One platform. Every system.",
      body: "Designed to integrate with EMIS Web and SystmOne via FHIR R4 and HL7 v2. No migration project and no rip-and-replace. Current demo uses synthetic patient data; production integration paths are on the roadmap.",
    },
    {
      num: "02",
      color: "bg-emerald",
      icon: Brain,
      title: "UNDERSTAND",
      sub: "A knowledge graph that reasons.",
      body: "Each patient record becomes a connected model in Neo4j: conditions linked to risks, medications to interactions, history to predictions. Twelve specialist agents run in parallel to surface insights.",
    },
    {
      num: "03",
      color: "bg-navy",
      icon: ShieldCheck,
      title: "ACT",
      sub: "Seven AI agents. One review queue.",
      body: "SYNTHESIS writes your SOAP note. DrASSIST codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a Draft in your Review Queue. Nothing writes to the FHIR record until you click Accept.",
    },
    {
      num: "04",
      color: "bg-emerald",
      icon: Sparkles,
      title: "LEARN",
      sub: "Every outcome improves the system.",
      body: "Approved decisions feed back into the knowledge graph. Rejected outputs inform model refinement. The platform improves with every consultation across practices in your ICS.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center md:mb-16">
          <p className="marketing-section-label mb-3">How it works</p>
          <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
            From Fragmented Data to Coordinated Care in Four Steps
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="marketing-capability-card rounded-2xl border border-border-subtle bg-white p-8"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.color}`}>
                    <Icon className="h-5 w-5 text-white" aria-hidden />
                  </div>
                  <span className="text-sm font-bold text-steel">{step.num}</span>
                </div>
                <div className="mb-3 inline-block rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-steel">
                  {step.title}
                </div>
                <h3 className="mb-3 text-lg font-bold text-navy">{step.sub}</h3>
                <p className="text-sm leading-relaxed text-steel">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
