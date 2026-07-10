"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const layers = [
  {
    title: "User Experience Layer",
    description:
      "Patient App  |  GP Dashboard  |  Hospital Command Centre  |  Admin Portal",
    className: "bg-sky-100 text-slate-800",
    margin: "ml-0",
    agents: null,
  },
  {
    title: "AI Orchestration Engine",
    description:
      "Agent Manager  ·  Workflow Engine  ·  Decision Engine  ·  Safety Guardrails",
    className: "bg-primary text-white",
    margin: "ml-4 sm:ml-8",
    agents: null,
  },
  {
    title: "AI Agent Ecosystem",
    description: "Hover to explore 12 specialist agents across three groups",
    className: "bg-secondary text-white",
    margin: "ml-8 sm:ml-16",
    agents: {
      patient: ["Health Companion", "Voice Care Agent"],
      clinical: [
        "Clinical Copilot",
        "Documentation",
        "Diagnostic Support",
        "Medication Intelligence",
        "Referral Agent",
      ],
      operational: [
        "Hospital Command",
        "Capacity Prediction",
        "Care Coordinator",
      ],
    },
  },
  {
    title: "Healthcare Knowledge Graph",
    description:
      "Clinical Knowledge  ·  Drug Database  ·  Care Guidelines  ·  Local Policies",
    className: "bg-layer-purple text-white",
    margin: "ml-12 sm:ml-24",
    agents: null,
  },
  {
    title: "Health Data Platform",
    description:
      "FHIR R4 Server  ·  HL7 v2  ·  DICOM  ·  Data Normalisation  ·  Identity Matching",
    className: "bg-layer-teal text-white",
    margin: "ml-16 sm:ml-32",
    agents: null,
  },
  {
    title: "Existing Healthcare Systems",
    description:
      "Epic  |  EMIS Web  |  SystmOne  |  Oracle Health  |  NHS Spine  |  Labs  |  PACS",
    className: "bg-layer-slate text-white",
    margin: "ml-20 sm:ml-40",
    agents: null,
  },
];

export function PlatformLayerDiagram() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Six Layers. One Healthcare Operating System.
          </h2>
        </div>
        <div className="space-y-3">
          {layers.map((layer, index) => (
            <div
              key={layer.title}
              className={cn(
                "rounded-lg border border-border p-5 shadow-sm transition-all duration-300",
                layer.className,
                layer.margin,
                index === 2 && "cursor-pointer"
              )}
              onMouseEnter={() => index === 2 && setExpanded(true)}
              onMouseLeave={() => index === 2 && setExpanded(false)}
            >
              <h3 className="text-lg font-semibold">{layer.title}</h3>
              <p className="mt-1 text-sm opacity-90">{layer.description}</p>
              {layer.agents && expanded ? (
                <div className="mt-4 grid gap-3 border-t border-white/20 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                      Patient Agents
                    </p>
                    <ul className="space-y-1 text-sm">
                      {layer.agents.patient.map((agent) => (
                        <li key={agent}>{agent}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                      Clinical Agents
                    </p>
                    <ul className="space-y-1 text-sm">
                      {layer.agents.clinical.map((agent) => (
                        <li key={agent}>{agent}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide">
                      Operational Agents
                    </p>
                    <ul className="space-y-1 text-sm">
                      {layer.agents.operational.map((agent) => (
                        <li key={agent}>{agent}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
