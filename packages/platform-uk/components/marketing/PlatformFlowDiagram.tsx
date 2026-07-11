"use client";

import { cn } from "@/lib/utils";

export type FlowNode = {
  id: string;
  label: string;
  sublabel?: string;
  highlight?: boolean;
};

const FULL_FLOW_NODES: FlowNode[] = [
  { id: "ehr", label: "EMIS / SystmOne", sublabel: "EHR systems" },
  { id: "data", label: "Data layer", sublabel: "FHIR intake" },
  { id: "graph", label: "Neo4j", sublabel: "Knowledge graph" },
  { id: "agents", label: "12 AI agents", sublabel: "Parallel drafts" },
  { id: "review", label: "Review queue", sublabel: "HITL", highlight: true },
  { id: "fhir", label: "FHIR staging", sublabel: "Draft resources" },
  { id: "write", label: "EHR write", sublabel: "On approval" },
];

const COMPACT_FLOW_NODES: FlowNode[] = [
  { id: "systems", label: "Systems", sublabel: "EMIS / SystmOne" },
  { id: "aksh", label: "Aksh", sublabel: "Data layer" },
  { id: "agents", label: "Agents", sublabel: "12 specialists" },
  { id: "review", label: "Review", sublabel: "HITL", highlight: true },
  { id: "record", label: "Record", sublabel: "FHIR write" },
];

type PlatformFlowDiagramProps = {
  variant: "compact" | "full";
  className?: string;
};

function FlowArrow({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-6 shrink-0 text-navy/25 md:h-5 md:w-8", className)}
      viewBox="0 0 32 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 10h24m0 0l-6-6m6 6l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowArrowVertical({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-6 w-4 shrink-0 text-navy/25", className)}
      viewBox="0 0 20 32"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 2v24m0 0l-6-6m6 6l6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowNodeBox({ node, compact }: { node: FlowNode; compact: boolean }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border text-center transition-shadow motion-safe:duration-300",
        compact ? "min-h-[4.5rem] px-3 py-3 sm:min-h-[5rem] sm:px-4" : "min-h-[5.5rem] px-4 py-4 sm:min-h-[6rem]",
        node.highlight
          ? "border-emerald/40 bg-emerald/10 shadow-md shadow-emerald/10 motion-safe:hover:shadow-lg motion-safe:hover:shadow-emerald/15"
          : "border-navy/15 bg-white shadow-sm motion-safe:hover:shadow-md"
      )}
    >
      <span
        className={cn(
          "font-bold leading-tight text-navy",
          compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
        )}
      >
        {node.label}
      </span>
      {node.sublabel ? (
        <span className={cn("mt-1 text-navy/55", compact ? "text-[10px] sm:text-xs" : "text-xs")}>
          {node.sublabel}
        </span>
      ) : null}
      {node.highlight ? (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          HITL
        </span>
      ) : null}
    </div>
  );
}

function FlowConnectorSvg({ variant }: { variant: "compact" | "full" }) {
  const nodeCount = variant === "compact" ? 5 : 7;

  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1000 120"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker id="flow-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#003D7A" fillOpacity="0.35" />
        </marker>
      </defs>
      {Array.from({ length: nodeCount - 1 }).map((_, index) => {
        const startX = ((index + 0.5) / nodeCount) * 1000 + 40;
        const endX = ((index + 1.5) / nodeCount) * 1000 - 40;
        return (
          <line
            key={index}
            x1={startX}
            y1="60"
            x2={endX}
            y2="60"
            stroke="#003D7A"
            strokeOpacity="0.2"
            strokeWidth="2"
            markerEnd="url(#flow-arrowhead)"
            className="motion-safe:animate-[flow-pulse_2.4s_ease-in-out_infinite]"
            style={{ animationDelay: `${index * 0.3}s` }}
          />
        );
      })}
    </svg>
  );
}

export function PlatformFlowDiagram({ variant, className }: PlatformFlowDiagramProps) {
  const nodes = variant === "compact" ? COMPACT_FLOW_NODES : FULL_FLOW_NODES;
  const ariaLabel =
    variant === "compact"
      ? "Platform flow: EHR systems connect to Aksh data layer, twelve AI agents draft outputs, clinicians review in the HITL queue, then approved content writes to the FHIR record."
      : "End-to-end journey: EMIS or SystmOne feeds the data layer, Neo4j knowledge graph, twelve AI agents, human review queue, FHIR staging, and EHR write on clinician approval.";

  return (
    <figure className={cn("relative", className)} aria-label={ariaLabel}>
      <figcaption className="sr-only">{ariaLabel}</figcaption>

      {/* Desktop horizontal layout */}
      <div className="relative hidden lg:block">
        <FlowConnectorSvg variant={variant} />
        <ol className="relative z-10 grid list-none gap-3 p-0" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
          {nodes.map((node) => (
            <li key={node.id}>
              <FlowNodeBox node={node} compact={variant === "compact"} />
            </li>
          ))}
        </ol>
      </div>

      {/* Tablet: wrapped rows with arrows */}
      <ol className="relative z-10 hidden list-none flex-wrap items-center justify-center gap-2 p-0 sm:flex lg:hidden">
        {nodes.map((node, index) => (
          <li key={node.id} className="flex items-center gap-2">
            <div className={variant === "compact" ? "w-[5.5rem] sm:w-[6.5rem]" : "w-[6.5rem] sm:w-[7.5rem]"}>
              <FlowNodeBox node={node} compact={variant === "compact"} />
            </div>
            {index < nodes.length - 1 ? <FlowArrow /> : null}
          </li>
        ))}
      </ol>

      {/* Mobile: vertical stack */}
      <ol className="relative z-10 flex list-none flex-col items-center gap-2 p-0 sm:hidden">
        {nodes.map((node, index) => (
          <li key={node.id} className="flex w-full max-w-[14rem] flex-col items-center">
            <FlowNodeBox node={node} compact={variant === "compact"} />
            {index < nodes.length - 1 ? <FlowArrowVertical className="my-1" /> : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}

export { FULL_FLOW_NODES, COMPACT_FLOW_NODES };
