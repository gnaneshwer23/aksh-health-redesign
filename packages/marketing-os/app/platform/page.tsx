import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformLayerDiagram } from "@/components/marketing/PlatformLayerDiagram";
import { createMetadata } from "@/lib/utils";

export const metadata: Metadata = createMetadata(
  "Platform Architecture",
  "Full platform architecture overview of the Aksh Health AI Healthcare Operating System."
);

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

export default function PlatformPage() {
  return (
    <>
      <section className="bg-navy-dark py-16 text-white lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Platform
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">
            The AI Healthcare Operating System
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Aksh Health is not a chatbot, patient portal, or EHR. It is the
            intelligence layer that sits above your existing healthcare
            infrastructure — EMIS Web, SystmOne, Epic, Oracle Health — and
            makes it intelligent, proactive, and coordinated.
          </p>
        </div>
      </section>
      <section className="bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {capabilities.map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <PlatformLayerDiagram />
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-8">
          <h2 className="text-2xl font-bold">See the platform in your environment</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Request a pilot to connect Aksh Health to your EMIS Web or SystmOne
            deployment with FHIR R4 integration.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/pilot/apply">Request a Pilot</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
