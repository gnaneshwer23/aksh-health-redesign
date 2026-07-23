import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardCheck,
  FileCode2,
  FileText,
  GitBranch,
  Mic,
  Pill,
  Shield,
  Waypoints,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ARIA_LABEL =
  "Interoperability diagram: CANVAS, SYNTHESIS, GUARDIAN, HORIZON, PATHWAY, SHIELD, and CONDUCTOR coordinate clinical drafts. A clinician reviews every output before FHIR R4 staging.";

type InteropNodeProps = {
  label: string;
  sub?: string;
  icon: LucideIcon;
  variant?: "default" | "hub" | "review";
  className?: string;
};

function InteropNode({
  label,
  sub,
  icon: Icon,
  variant = "default",
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
      <span className="aksh-interop-node__icon" aria-hidden>
        <Icon className="aksh-interop-node__glyph" strokeWidth={1.75} />
      </span>
      <p className="aksh-interop-node__label">{label}</p>
      {sub ? <p className="aksh-interop-node__sub">{sub}</p> : null}
    </div>
  );
}

/** Product illustration — named agents → clinician gate → FHIR + SHIELD. */
export function InteroperabilityDiagram({ className }: { className?: string }) {
  return (
    <figure
      role="img"
      className={cn("aksh-interop-diagram aksh-interop-diagram--agents", className)}
      aria-label={ARIA_LABEL}
    >
      <figcaption className="sr-only">{ARIA_LABEL}</figcaption>

      <div className="aksh-interop-diagram__wash" aria-hidden />
      <div className="aksh-interop-diagram__hub-glow" aria-hidden />

      <div className="aksh-interop-agents" aria-hidden>
        <div className="aksh-interop-agents__row aksh-interop-agents__row--agents">
          <InteropNode label="CANVAS" sub="Intake" icon={Mic} />
          <InteropNode label="SYNTHESIS" sub="Documentation" icon={FileText} />
          <InteropNode label="GUARDIAN" sub="Drug safety" icon={Pill} />
          <InteropNode label="HORIZON" sub="Risk" icon={Activity} />
        </div>
        <div className="aksh-interop-agents__row aksh-interop-agents__row--mid">
          <InteropNode label="PATHWAY" sub="Referral" icon={GitBranch} />
          <InteropNode label="CONDUCTOR" sub="Orchestration" icon={Waypoints} variant="hub" />
          <InteropNode label="SHIELD" sub="Audit" icon={Shield} />
        </div>
        <div className="aksh-interop-agents__row aksh-interop-agents__row--out">
          <InteropNode
            label="Clinician review"
            sub="Accept · edit · reject"
            icon={ClipboardCheck}
            variant="review"
          />
          <InteropNode label="FHIR staging" sub="R4 · draft resources" icon={FileCode2} />
        </div>
      </div>
    </figure>
  );
}
