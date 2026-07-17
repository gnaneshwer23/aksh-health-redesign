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

const layerStyles: Record<FlowLayer, { tile: string; icon: string }> = {
  intake: {
    tile: "border-navy/10 bg-[var(--mk-surface)]",
    icon: "text-emerald",
  },
  draft: {
    tile: "border-navy/10 bg-[var(--mk-surface)]",
    icon: "text-emerald",
  },
  review: {
    tile: "border-emerald/30 bg-emerald/[0.07]",
    icon: "text-emerald",
  },
  output: {
    tile: "border-navy/10 bg-[var(--mk-surface)]",
    icon: "text-emerald",
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

function FlowNodeTile({
  node,
  showDescription,
  showLabel = true,
}: {
  node: FlowNode;
  showDescription: boolean;
  showLabel?: boolean;
}) {
  const Icon = node.icon;
  const styles = layerStyles[node.layer];

  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="relative">
        {node.highlight ? (
          <span className="absolute -right-2 -top-2 z-10 rounded-full border-2 border-white bg-emerald px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white">
            You
          </span>
        ) : null}
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-3xl border shadow-[var(--mk-shadow-float)]",
            styles.tile
          )}
        >
          <Icon className={cn("h-6 w-6 stroke-[1.75]", styles.icon)} aria-hidden />
        </div>
      </div>

      {showLabel ? <p className="mt-4 text-sm font-bold leading-tight text-navy sm:text-base">{node.label}</p> : null}

      {showLabel && showDescription ? (
        <p className="mt-2 max-w-[12rem] text-xs leading-relaxed text-steel">
          {node.description}
        </p>
      ) : null}
    </div>
  );
}

function MobileFlow({ nodes, showDescription }: { nodes: FlowNode[]; showDescription: boolean }) {
  return (
    <ol className="list-none p-0 md:hidden">
      {nodes.map((node, index) => (
        <li key={node.id} className="relative flex min-h-24 gap-5 pb-8 last:min-h-0 last:pb-0">
          {index < nodes.length - 1 ? (
            <span
              className="absolute bottom-0 left-[1.96875rem] top-16 w-px bg-navy/15"
              aria-hidden
            />
          ) : null}
          <div className="relative z-10 shrink-0">
            <FlowNodeTile node={node} showDescription={false} showLabel={false} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-base font-bold text-navy">{node.label}</p>
            {showDescription ? <p className="mt-1 text-sm leading-relaxed text-steel">{node.description}</p> : null}
            {index < nodes.length - 1 ? <span className="sr-only">Then</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function DesktopFlow({ nodes, showDescription }: { nodes: FlowNode[]; showDescription: boolean }) {
  return (
    <ol
      className="hidden list-none gap-0 p-0 md:grid"
      style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}
    >
      {nodes.map((node, index) => (
        <li key={node.id} className="relative min-w-0 px-2 lg:px-4">
          {index < nodes.length - 1 ? (
            <span
              className="absolute left-[calc(50%+2rem)] right-[calc(-50%+2rem)] top-8 h-px bg-navy/15"
              aria-hidden
            />
          ) : null}
          <div className="relative z-10 h-full">
            <FlowNodeTile node={node} showDescription={showDescription} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PlatformFlowDiagram({ variant, className, showDescriptions = true }: PlatformFlowDiagramProps) {
  const nodes = getNodes(variant);
  const ariaLabel = getAriaLabel(variant);

  return (
    <figure className={cn("aksh-flow", className)} aria-label={ariaLabel}>
      <figcaption className="sr-only">{ariaLabel}</figcaption>
      <DesktopFlow nodes={nodes} showDescription={showDescriptions} />
      <MobileFlow nodes={nodes} showDescription={showDescriptions} />
    </figure>
  );
}

export { FULL_FLOW_NODES, COMPACT_FLOW_NODES, ARCHITECTURE_FLOW_NODES, JOURNEY_FLOW_NODES };
