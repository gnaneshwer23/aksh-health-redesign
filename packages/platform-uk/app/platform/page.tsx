import type { Metadata } from "next";
import Link from "next/link";

import { AudiencePage } from "@/components/marketing/AudienceHero";

export const metadata: Metadata = {
  title: "Platform Architecture",
  description: "Full platform architecture overview of the Aksh Health AI Healthcare Operating System.",
};

const capabilities = [
  {
    title: "Interoperability First",
    body: "FHIR R4, HL7 v2, DICOM, and NHS Spine connectivity without replacing your EHR.",
  },
  {
    title: "Knowledge Graph Reasoning",
    body: "Neo4j-powered clinical knowledge graph with John Snow Labs NLP for structured reasoning.",
  },
  {
    title: "Multi-Agent Orchestration",
    body: "Twelve specialist AI agents coordinated through a single workflow engine with safety guardrails.",
  },
  {
    title: "Human-in-the-Loop Governance",
    body: "Every clinical action requires explicit approval. Immutable audit trail for CQC and ICS governance.",
  },
];

const layers = [
  { name: "Experience", detail: "Role dashboards, review queue, patient companion" },
  { name: "Intelligence", detail: "12 AI agents with memory, permissions, and HITL gates" },
  { name: "Knowledge", detail: "Neo4j clinical graph + FHIR R4 resource model" },
  { name: "Integration", detail: "EMIS, SystmOne, Epic, HL7 v2, NHS Spine" },
];

export default function PlatformPage() {
  return (
    <AudiencePage
      kicker="Platform"
      title="The AI Healthcare Operating System"
      description="Aksh Health is not a chatbot, patient portal, or EHR. It is the intelligence layer that sits above your existing healthcare infrastructure — EMIS Web, SystmOne, Epic, Oracle Health — and makes it intelligent, proactive, and coordinated."
    >
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map((item) => (
              <article key={item.title} className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-bold text-navy">{item.title}</h2>
                <p className="mt-2 text-sm text-steel">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <h2 className="text-2xl font-bold text-navy">Four layers. One connected platform.</h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4">
            {layers.map((layer, index) => (
              <div
                key={layer.name}
                className="rounded-xl border border-border bg-white p-5 text-left shadow-sm"
                style={{ marginLeft: `${index * 12}px`, marginRight: `${(layers.length - index - 1) * 12}px` }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-emerald">{layer.name}</p>
                <p className="mt-1 text-sm text-slate">{layer.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-bold text-navy">See the platform in your environment</h2>
          <p className="mt-3 text-steel">
            Request a pilot to connect Aksh Health to your EMIS Web or SystmOne deployment with FHIR R4 integration.
          </p>
          <Link
            href="/pilot/apply"
            className="mt-6 inline-block rounded-xl bg-navy px-8 py-3 font-bold text-white transition-colors hover:bg-navy/90"
          >
            Request a Pilot
          </Link>
        </div>
      </section>
    </AudiencePage>
  );
}
