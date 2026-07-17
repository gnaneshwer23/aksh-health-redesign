import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  FileCode2,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ARIA_LABEL =
  "Interoperability diagram: EMIS Web and SystmOne connect into Aksh Health care coordination. A clinician reviews every output before FHIR R4 staging and SHIELD audit logging.";

type InteropNodeProps = {
  label: string;
  sub?: string;
  icon: LucideIcon;
  variant?: "default" | "hub" | "review";
  badge?: string;
  className?: string;
};

function InteropNode({
  label,
  sub,
  icon: Icon,
  variant = "default",
  badge,
  className,
}: InteropNodeProps) {
  return (
    <div
      className={cn(
        "aksh-interop-node",
        variant === "hub" && "aksh-interop-node--hub",
        variant === "review" && "aksh-interop-node--review",
        className
      )}
    >
      {badge ? (
        <span className="aksh-interop-node__badge" aria-hidden>
          {badge}
        </span>
      ) : null}
      <span className="aksh-interop-node__icon" aria-hidden>
        <Icon className="aksh-interop-node__glyph" strokeWidth={1.75} />
      </span>
      <p className="aksh-interop-node__label">{label}</p>
      {sub ? <p className="aksh-interop-node__sub">{sub}</p> : null}
    </div>
  );
}

/** Product illustration — EHR sources → Aksh hub → clinician gate → FHIR + SHIELD. */
export function InteroperabilityDiagram({ className }: { className?: string }) {
  return (
    <figure
      role="img"
      className={cn("aksh-interop-diagram marketing-frame", className)}
      aria-label={ARIA_LABEL}
    >
      <figcaption className="sr-only">{ARIA_LABEL}</figcaption>

      <div className="aksh-interop-diagram__wash" aria-hidden />
      <div className="aksh-interop-diagram__hub-glow" aria-hidden />

      <svg
        className="aksh-interop-diagram__connectors"
        viewBox="0 0 360 400"
        fill="none"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="aksh-interop-arrow"
            viewBox="0 0 8 8"
            markerWidth="5.5"
            markerHeight="5.5"
            refX="6.5"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M1 1.2 L6.8 4 L1 6.8 Z" fill="currentColor" />
          </marker>
        </defs>

        {/* Structural orthogonal paths — column centers 60 / 180 / 300 */}
        <g className="aksh-interop-diagram__wires">
          {/* EHRs → hub */}
          <path d="M 60 71 L 60 107 L 180 107 L 180 114" />
          <path d="M 300 71 L 300 107 L 180 107" />
          {/* Hub → clinician review */}
          <path d="M 180 186 L 180 222" markerEnd="url(#aksh-interop-arrow)" />
          {/* Review → FHIR + SHIELD */}
          <path d="M 180 293 L 180 329 L 60 329 L 60 340" markerEnd="url(#aksh-interop-arrow)" />
          <path d="M 180 293 L 180 329 L 300 329 L 300 340" markerEnd="url(#aksh-interop-arrow)" />
        </g>

        {/* Restrained flow cue — soft dashed overlay */}
        <g className="aksh-interop-diagram__flow">
          <path d="M 60 71 L 60 107 L 180 107 L 180 114" />
          <path d="M 300 71 L 300 107 L 180 107" />
          <path d="M 180 186 L 180 222" />
          <path d="M 180 293 L 180 329 L 60 329 L 60 340" />
          <path d="M 180 293 L 180 329 L 300 329 L 300 340" />
        </g>

        <circle className="aksh-interop-diagram__junction" cx="180" cy="107" r="3.25" />
        <circle className="aksh-interop-diagram__junction" cx="180" cy="329" r="3.25" />
      </svg>

      <div className="aksh-interop-diagram__grid" aria-hidden>
        <InteropNode
          label="EMIS Web"
          sub="Primary care"
          icon={MonitorSmartphone}
          className="aksh-interop-diagram__emis"
        />
        <InteropNode
          label="SystmOne"
          sub="Primary care"
          icon={MonitorSmartphone}
          className="aksh-interop-diagram__systm"
        />
        <InteropNode
          label="Aksh Health"
          sub="Care coordination"
          icon={ShieldCheck}
          variant="hub"
          className="aksh-interop-diagram__hub"
        />
        <InteropNode
          label="Clinician review"
          sub="Accept · edit · reject"
          icon={ClipboardCheck}
          variant="review"
          badge="You"
          className="aksh-interop-diagram__review"
        />
        <InteropNode
          label="FHIR staging"
          sub="R4 · draft resources"
          icon={FileCode2}
          className="aksh-interop-diagram__fhir"
        />
        <InteropNode
          label="SHIELD audit"
          sub="Immutable trail"
          icon={Shield}
          className="aksh-interop-diagram__shield"
        />
      </div>
    </figure>
  );
}
