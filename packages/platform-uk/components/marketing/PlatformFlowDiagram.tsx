"use client";

import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileCheck2,
  Mic,
  MonitorSmartphone,
  PencilLine,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type FlowLayer = "intake" | "draft" | "review" | "output";

export type FlowNode = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  layer: FlowLayer;
  highlight?: boolean;
};

const layerStyles: Record<FlowLayer, { border: string; bg: string; icon: string; ring: string }> = {
  intake: {
    border: "border-steel/25",
    bg: "bg-steel/[0.06]",
    icon: "text-steel",
    ring: "shadow-steel/10",
  },
  draft: {
    border: "border-pastel-lavender-ink/25",
    bg: "bg-pastel-lavender/60",
    icon: "text-pastel-lavender-ink",
    ring: "shadow-pastel-lavender-ink/10",
  },
  review: {
    border: "border-emerald",
    bg: "bg-emerald/10",
    icon: "text-emerald",
    ring: "shadow-emerald/15",
  },
  output: {
    border: "border-navy/20",
    bg: "bg-navy/[0.05]",
    icon: "text-navy",
    ring: "shadow-navy/10",
  },
};

export const FLOW_LAYER_LEGEND: Array<{ layer: FlowLayer; label: string }> = [
  { layer: "intake", label: "Capture" },
  { layer: "draft", label: "Draft + checks" },
  { layer: "review", label: "Clinician approves" },
  { layer: "output", label: "Governed record" },
];

/** Calm 3-step care journey used on homepage and marketing surfaces. */
const JOURNEY_FLOW_NODES: FlowNode[] = [
  {
    id: "capture",
    label: "Capture",
    description: "Consult notes or voice from EMIS / SystmOne context",
    icon: Mic,
    layer: "intake",
  },
  {
    id: "draft",
    label: "Draft + checks",
    description: "Structured note, safety flags, referral package",
    icon: PencilLine,
    layer: "draft",
  },
  {
    id: "approve",
    label: "Clinician approves",
    description: "Accept, edit, or reject before the record",
    icon: ClipboardCheck,
    layer: "review",
    highlight: true,
  },
];

const COMPACT_FLOW_NODES: FlowNode[] = JOURNEY_FLOW_NODES;

const FULL_FLOW_NODES: FlowNode[] = [
  {
    id: "ehr",
    label: "EMIS / SystmOne",
    description: "Clinical context via FHIR-ready paths",
    icon: MonitorSmartphone,
    layer: "intake",
  },
  {
    id: "capture",
    label: "Capture",
    description: "Consult notes or voice",
    icon: Mic,
    layer: "intake",
  },
  {
    id: "draft",
    label: "Draft + checks",
    description: "Notes, safety, referrals staged",
    icon: PencilLine,
    layer: "draft",
  },
  {
    id: "review",
    label: "Clinician review",
    description: "Accept, edit, or reject",
    icon: ClipboardCheck,
    layer: "review",
    highlight: true,
  },
  {
    id: "record",
    label: "Governed record",
    description: "FHIR staging after approval",
    icon: FileCheck2,
    layer: "output",
  },
];

const ARCHITECTURE_FLOW_NODES: FlowNode[] = [
  {
    id: "emis",
    label: "EMIS / SystmOne",
    description: "Primary care record",
    icon: MonitorSmartphone,
    layer: "intake",
  },
  {
    id: "aksh",
    label: "Aksh Health",
    description: "Drafts, checks, audit",
    icon: ShieldCheck,
    layer: "draft",
  },
  {
    id: "review",
    label: "Clinician approves",
    description: "Accept, edit, or reject",
    icon: ClipboardCheck,
    layer: "review",
    highlight: true,
  },
  {
    id: "fhir",
    label: "FHIR staging",
    description: "Write-back only when approved",
    icon: FileCheck2,
    layer: "output",
  },
];

type PlatformFlowDiagramProps = {
  variant: "compact" | "full" | "architecture" | "journey";
  className?: string;
  showDescriptions?: boolean;
};

function getNodes(variant: PlatformFlowDiagramProps["variant"]) {
  if (variant === "architecture") return ARCHITECTURE_FLOW_NODES;
  if (variant === "compact" || variant === "journey") return JOURNEY_FLOW_NODES;
  return FULL_FLOW_NODES;
}

function getAriaLabel(variant: PlatformFlowDiagramProps["variant"]) {
  if (variant === "architecture") {
    return "Architecture flow: EMIS or SystmOne connects to Aksh Health, clinicians approve every output, then approved content stages as FHIR.";
  }
  if (variant === "compact" || variant === "journey") {
    return "Care journey: capture the consult, draft notes and checks, then the clinician approves before anything reaches the record.";
  }
  return "End-to-end journey: EMIS or SystmOne context, capture, draft and clinical checks, clinician review, then FHIR staging on approval.";
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
  const styles = layerStyles[node.layer];

  return (
    <div className="group flex flex-col items-center text-center">
      <div className="relative">
        {node.highlight ? (
          <span className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            You
          </span>
        ) : null}
        <div
          className={cn(
            "flex items-center justify-center rounded-full border-2 shadow-sm transition-shadow motion-safe:duration-300 motion-safe:group-hover:shadow-md",
            compact ? "h-12 w-12 sm:h-14 sm:w-14" : "h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]",
            styles.border,
            styles.bg,
            node.highlight && "shadow-lg motion-safe:group-hover:shadow-xl"
          )}
        >
          <Icon
            className={cn(compact ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-7 sm:w-7", styles.icon)}
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
            compact ? "max-w-[8rem] text-[10px] sm:max-w-[9rem] sm:text-xs" : "max-w-[10rem] text-xs sm:max-w-[11rem]"
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
        const isHitlConnector = index === nodeCount - 2;

        return (
          <path
            key={index}
            d={`M ${startX} 32 Q ${midX} ${isHitlConnector ? 8 : 32} ${endX} 32`}
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
            {index < nodes.length - 1 ? <span className="sr-only">Then</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function TabletFlow({
  nodes,
  compact,
  showDescription,
}: {
  nodes: FlowNode[];
  compact: boolean;
  showDescription: boolean;
}) {
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

function FlowLayerLegend({ layers }: { layers: FlowLayer[] }) {
  const activeLegend = FLOW_LAYER_LEGEND.filter((entry) => layers.includes(entry.layer));

  return (
    <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 p-0 lg:mt-10" aria-hidden>
      {activeLegend.map((entry) => {
        const styles = layerStyles[entry.layer];
        return (
          <li key={entry.layer} className="flex items-center gap-2 text-xs font-medium text-steel">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full border", styles.border, styles.bg)} />
            {entry.label}
          </li>
        );
      })}
    </ul>
  );
}

export function PlatformFlowDiagram({ variant, className, showDescriptions = true }: PlatformFlowDiagramProps) {
  const nodes = getNodes(variant);
  const ariaLabel = getAriaLabel(variant);
  const isCompact = variant === "compact" || variant === "architecture" || variant === "journey";
  const layersPresent = Array.from(new Set(nodes.map((node) => node.layer)));

  return (
    <figure className={cn("relative", className)} aria-label={ariaLabel}>
      <figcaption className="sr-only">{ariaLabel}</figcaption>

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

      {showDescriptions ? <FlowLayerLegend layers={layersPresent} /> : null}
    </figure>
  );
}

export { FULL_FLOW_NODES, COMPACT_FLOW_NODES, ARCHITECTURE_FLOW_NODES, JOURNEY_FLOW_NODES };
