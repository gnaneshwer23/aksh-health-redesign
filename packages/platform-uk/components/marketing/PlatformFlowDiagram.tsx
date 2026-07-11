"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ClipboardCheck,
  FileCheck2,
  Layers,
  MonitorSmartphone,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type FlowNode = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  highlight?: boolean;
};

const FULL_FLOW_NODES: FlowNode[] = [
  {
    id: "ehr",
    label: "EMIS / SystmOne",
    description: "EHR intake via FHIR R4 and HL7 v2",
    icon: MonitorSmartphone,
  },
  {
    id: "data",
    label: "Data layer",
    description: "Normalised clinical data pipeline",
    icon: Layers,
  },
  {
    id: "graph",
    label: "Neo4j graph",
    description: "Connected patient knowledge model",
    icon: Network,
  },
  {
    id: "agents",
    label: "12 AI agents",
    description: "Parallel specialist drafts",
    icon: Bot,
  },
  {
    id: "review",
    label: "Review queue",
    description: "Clinician Accept, Edit, or Reject",
    icon: ClipboardCheck,
    highlight: true,
  },
  {
    id: "fhir",
    label: "FHIR staging",
    description: "Draft resources before write-back",
    icon: FileCheck2,
  },
  {
    id: "write",
    label: "EHR write",
    description: "Approved content to the record",
    icon: Server,
  },
];

const COMPACT_FLOW_NODES: FlowNode[] = [
  {
    id: "systems",
    label: "Systems",
    description: "EMIS / SystmOne",
    icon: MonitorSmartphone,
  },
  {
    id: "aksh",
    label: "Aksh",
    description: "Data layer and agents",
    icon: Layers,
  },
  {
    id: "review",
    label: "Review",
    description: "Human approval required",
    icon: ClipboardCheck,
    highlight: true,
  },
  {
    id: "record",
    label: "Record",
    description: "FHIR write on approval",
    icon: FileCheck2,
  },
];

const ARCHITECTURE_FLOW_NODES: FlowNode[] = [
  {
    id: "emis",
    label: "EMIS Web",
    description: "Primary care record",
    icon: MonitorSmartphone,
  },
  {
    id: "aksh",
    label: "Aksh platform",
    description: "Graph, agents, governance",
    icon: ShieldCheck,
  },
  {
    id: "review",
    label: "Clinician review",
    description: "Accept, Edit, or Reject",
    icon: ClipboardCheck,
    highlight: true,
  },
  {
    id: "fhir",
    label: "FHIR R4",
    description: "Governed write-back",
    icon: FileCheck2,
  },
];

type PlatformFlowDiagramProps = {
  variant: "compact" | "full" | "architecture";
  className?: string;
  showDescriptions?: boolean;
};

function getNodes(variant: PlatformFlowDiagramProps["variant"]) {
  if (variant === "architecture") return ARCHITECTURE_FLOW_NODES;
  if (variant === "compact") return COMPACT_FLOW_NODES;
  return FULL_FLOW_NODES;
}

function getAriaLabel(variant: PlatformFlowDiagramProps["variant"]) {
  if (variant === "architecture") {
    return "Architecture flow: EMIS Web connects to the Aksh platform, clinicians review every output, then approved content writes back as FHIR R4.";
  }
  if (variant === "compact") {
    return "Platform flow: EHR systems connect to Aksh data layer, twelve AI agents draft outputs, clinicians review in the HITL queue, then approved content writes to the FHIR record.";
  }
  return "End-to-end journey: EMIS or SystmOne feeds the data layer, Neo4j knowledge graph, twelve AI agents, human review queue, FHIR staging, and EHR write on clinician approval.";
}

function FlowNodeCircle({
  node,
  compact,
  showDescription,
}: {
  node: FlowNode;
  compact: boolean;
  showDescription: boolean;
}) {
  const Icon = node.icon;

  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative">
        {node.highlight ? (
          <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            HITL
          </span>
        ) : null}
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 transition-shadow motion-safe:duration-300",
            compact ? "h-12 w-12 sm:h-14 sm:w-14" : "h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]",
            node.highlight
              ? "border-emerald bg-emerald/10 shadow-lg shadow-emerald/15 motion-safe:group-hover:shadow-xl motion-safe:group-hover:shadow-emerald/20"
              : "border-navy/15 bg-white shadow-sm motion-safe:group-hover:border-navy/25 motion-safe:group-hover:shadow-md"
          )}
        >
          <Icon
            className={cn(
              compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-7 sm:w-7",
              node.highlight ? "text-emerald" : "text-navy"
            )}
            aria-hidden
          />
        </div>
      </div>

      <p
        className={cn(
          "mt-3 font-bold leading-tight text-navy",
          compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
        )}
      >
        {node.label}
      </p>

      {showDescription ? (
        <p
          className={cn(
            "mt-1 leading-snug text-steel",
            compact ? "max-w-[7rem] text-[10px] sm:max-w-[8rem] sm:text-xs" : "max-w-[9rem] text-xs sm:max-w-[10rem]"
          )}
        >
          {node.description}
        </p>
      ) : null}
    </div>
  );
}

function DesktopFlowConnector({ nodeCount }: { nodeCount: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-[2.25rem] hidden h-16 w-full lg:block md:top-[2.5rem]"
      viewBox="0 0 1000 64"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <marker id="flow-arrowhead-emerald" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#00A86B" fillOpacity="0.5" />
        </marker>
        <marker id="flow-arrowhead-navy" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#003D7A" fillOpacity="0.3" />
        </marker>
      </defs>
      {Array.from({ length: nodeCount - 1 }).map((_, index) => {
        const startX = ((index + 0.5) / nodeCount) * 1000 + 56;
        const endX = ((index + 1.5) / nodeCount) * 1000 - 56;
        const midX = (startX + endX) / 2;
        const isBeforeHitl = index === nodeCount - 3 && nodeCount === 7;
        const isHitlConnector = index === nodeCount - 2 && nodeCount >= 4;

        return (
          <path
            key={index}
            d={`M ${startX} 32 Q ${midX} ${isBeforeHitl || isHitlConnector ? 8 : 32} ${endX} 32`}
            fill="none"
            stroke={isHitlConnector ? "#00A86B" : "#003D7A"}
            strokeOpacity={isHitlConnector ? 0.45 : 0.22}
            strokeWidth="2"
            markerEnd={isHitlConnector ? "url(#flow-arrowhead-emerald)" : "url(#flow-arrowhead-navy)"}
            className="motion-safe:animate-[flow-pulse_2.4s_ease-in-out_infinite]"
            style={{ animationDelay: `${index * 0.25}s` }}
          />
        );
      })}
    </svg>
  );
}

function MobileTimeline({ nodes, showDescription }: { nodes: FlowNode[]; showDescription: boolean }) {
  return (
    <ol className="relative list-none space-y-0 p-0 lg:hidden">
      <div
        className="absolute bottom-6 left-[1.6875rem] top-6 w-0.5 bg-gradient-to-b from-navy/15 via-emerald/30 to-navy/15 sm:left-[1.9375rem]"
        aria-hidden
      />
      {nodes.map((node, index) => (
        <li key={node.id} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-5">
          <div className="relative z-10 shrink-0">
            <FlowNodeCircle node={node} compact={false} showDescription={false} />
          </div>
          <div className="min-w-0 flex-1 pt-2 sm:pt-3">
            <p className="text-base font-bold text-navy">{node.label}</p>
            {showDescription ? <p className="mt-1 text-sm leading-relaxed text-steel">{node.description}</p> : null}
            {index < nodes.length - 1 ? (
              <span className="sr-only">Then</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TabletFlow({ nodes, compact, showDescription }: { nodes: FlowNode[]; compact: boolean; showDescription: boolean }) {
  return (
    <ol className="relative z-10 hidden list-none flex-wrap items-start justify-center gap-x-2 gap-y-6 p-0 sm:flex lg:hidden">
      {nodes.map((node, index) => (
        <li key={node.id} className="flex items-start">
          <div className="flex flex-col items-center">
            <FlowNodeCircle node={node} compact={compact} showDescription={showDescription} />
          </div>
          {index < nodes.length - 1 ? (
            <div className="flex h-14 items-center px-1 sm:px-2" aria-hidden>
              <svg className="h-4 w-6 text-navy/25" viewBox="0 0 32 20" fill="none">
                <path
                  d="M2 10h24m0 0l-6-6m6 6l-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function PlatformFlowDiagram({ variant, className, showDescriptions = true }: PlatformFlowDiagramProps) {
  const nodes = getNodes(variant);
  const ariaLabel = getAriaLabel(variant);
  const isCompact = variant === "compact" || variant === "architecture";

  return (
    <figure className={cn("relative", className)} aria-label={ariaLabel}>
      <figcaption className="sr-only">{ariaLabel}</figcaption>

      {/* Desktop horizontal */}
      <div className="relative hidden lg:block">
        <DesktopFlowConnector nodeCount={nodes.length} />
        <ol
          className="relative z-10 grid list-none gap-4 p-0"
          style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}
        >
          {nodes.map((node) => (
            <li key={node.id}>
              <FlowNodeCircle node={node} compact={isCompact} showDescription={showDescriptions} />
            </li>
          ))}
        </ol>
      </div>

      <TabletFlow nodes={nodes} compact={isCompact} showDescription={showDescriptions} />

      <div className="sm:hidden">
        <MobileTimeline nodes={nodes} showDescription={showDescriptions} />
      </div>
    </figure>
  );
}

export { FULL_FLOW_NODES, COMPACT_FLOW_NODES, ARCHITECTURE_FLOW_NODES };
