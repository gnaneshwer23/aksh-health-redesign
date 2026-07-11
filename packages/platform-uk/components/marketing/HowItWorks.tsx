import Link from "next/link";
import { ArrowRight, Brain, Link2, ShieldCheck, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      pastel: "bg-pastel-blue",
      ink: "text-pastel-blue-ink",
      icon: Link2,
      title: "Connect",
      sub: "One platform. Every system.",
      body: "Designed to integrate with EMIS Web and SystmOne via FHIR R4 and HL7 v2. No migration project and no rip-and-replace. Current demo uses synthetic patient data; production integration paths are on the roadmap.",
    },
    {
      num: "02",
      pastel: "bg-pastel-mint",
      ink: "text-pastel-mint-ink",
      icon: Brain,
      title: "Understand",
      sub: "A knowledge graph that reasons.",
      body: "Each patient record becomes a connected model in Neo4j: conditions linked to risks, medications to interactions, history to predictions. Twelve specialist agents run in parallel to surface insights.",
    },
    {
      num: "03",
      pastel: "bg-pastel-lavender",
      ink: "text-pastel-lavender-ink",
      icon: ShieldCheck,
      title: "Act",
      sub: "Twelve AI agents. One review queue.",
      body: "SYNTHESIS writes your SOAP note. DrASSIST codes the diagnosis. GUARDIAN checks drug interactions. ORACLE scores patient risk. Everything appears as a Draft in your Review Queue. Nothing writes to the FHIR record until you click Accept.",
    },
    {
      num: "04",
      pastel: "bg-pastel-peach",
      ink: "text-pastel-peach-ink",
      icon: Sparkles,
      title: "Learn",
      sub: "Every outcome improves the system.",
      body: "Approved decisions feed back into the knowledge graph. Rejected outputs inform model refinement. The platform improves with every consultation across practices in your ICS.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col gap-6 text-center md:mb-16 md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <p className="marketing-section-label mb-3">Popular capabilities</p>
            <h2 className="text-3xl font-bold tracking-tight text-navy md:text-4xl">
              From fragmented data to coordinated care
            </h2>
          </div>
          <Link
            href="/platform"
            className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-navy/15 bg-white px-6 py-3 text-sm font-semibold text-navy shadow-sm transition-all hover:-translate-y-0.5 hover:border-navy/30 md:mx-0"
          >
            Explore platform
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`marketing-pastel-card rounded-2xl border border-white/60 p-8 ${step.pastel}`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
                    <Icon className={`h-5 w-5 ${step.ink}`} aria-hidden />
                  </div>
                  <span className="text-sm font-bold text-navy/40">{step.num}</span>
                </div>
                <h3 className={`mb-1 text-xs font-bold uppercase tracking-wider ${step.ink}`}>{step.title}</h3>
                <p className="mb-3 text-lg font-bold text-navy">{step.sub}</p>
                <p className="text-sm leading-relaxed text-steel">{step.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
