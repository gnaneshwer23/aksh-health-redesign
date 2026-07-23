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
  "Interoperability diagram: EMIS Web and SystmOne context feeds CANVAS intake. CONDUCTOR orchestrates parallel drafts from SYNTHESIS, GUARDIAN, HORIZON, and PATHWAY. A clinician accepts, edits, or rejects every draft before FHIR R4 staging and SHIELD audit. Drafts only — no live EMR write.";

type InteropNodeProps = {
  label: string;
  sub?: string;
  icon: LucideIcon;
  variant?: "default" | "hub" | "review" | "compact" | "source";
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
        variant === "compact" && "aksh-interop-node--compact",
        variant === "source" && "aksh-interop-node--source",
        className
      )}
    >
      <span className="aksh-interop-node__icon" aria-hidden>
        <Icon className="aksh-interop-node__glyph" strokeWidth={1.75} />
      </span>
      <div className="aksh-interop-node__text">
        <p className="aksh-interop-node__label">{label}</p>
        {sub ? <p className="aksh-interop-node__sub">{sub}</p> : null}
      </div>
    </div>
  );
}

function PipeArrow({ label }: { label?: string }) {
  return (
    <div className="aksh-interop-pipe__arrow" aria-hidden>
      <span className="aksh-interop-pipe__arrow-line" />
      {label ? <span className="aksh-interop-pipe__arrow-label">{label}</span> : null}
      <span className="aksh-interop-pipe__arrow-head" />
    </div>
  );
}

/** Product illustration — intake → CONDUCTOR + parallel drafts → clinician gate → FHIR + SHIELD. */
export function InteroperabilityDiagram({ className }: { className?: string }) {
  return (
    <figure
      role="img"
      className={cn("aksh-interop-diagram aksh-interop-diagram--pipeline", className)}
      aria-label={ARIA_LABEL}
      data-testid="interop-pipeline-diagram"
    >
      <figcaption className="sr-only">{ARIA_LABEL}</figcaption>

      <div className="aksh-interop-diagram__wash" aria-hidden />
      <div className="aksh-interop-diagram__hub-glow" aria-hidden />

      <div className="aksh-interop-pipe" aria-hidden>
        <div className="aksh-interop-pipe__stage aksh-interop-pipe__stage--sources">
          <p className="aksh-interop-pipe__eyebrow">Clinical context</p>
          <div className="aksh-interop-pipe__sources">
            <span className="aksh-interop-pipe__source">EMIS Web</span>
            <span className="aksh-interop-pipe__source-sep" />
            <span className="aksh-interop-pipe__source">SystmOne</span>
          </div>
          <p className="aksh-interop-pipe__honesty">Designed for · not a live feed</p>
        </div>

        <PipeArrow />

        <div className="aksh-interop-pipe__stage aksh-interop-pipe__stage--intake">
          <InteropNode label="CANVAS" sub="Intake" icon={Mic} />
        </div>

        <PipeArrow label="orchestrates" />

        <div className="aksh-interop-pipe__stage aksh-interop-pipe__stage--orchestra">
          <InteropNode label="CONDUCTOR" sub="Orchestration" icon={Waypoints} variant="hub" />
          <p className="aksh-interop-pipe__parallel-label">Parallel drafts</p>
          <div className="aksh-interop-pipe__drafts">
            <InteropNode label="SYNTHESIS" sub="Documentation" icon={FileText} variant="compact" />
            <InteropNode label="GUARDIAN" sub="Drug safety" icon={Pill} variant="compact" />
            <InteropNode label="HORIZON" sub="Risk" icon={Activity} variant="compact" />
            <InteropNode label="PATHWAY" sub="Referral" icon={GitBranch} variant="compact" />
          </div>
        </div>

        <PipeArrow label="clinician decides" />

        <div className="aksh-interop-pipe__stage aksh-interop-pipe__stage--gate">
          <InteropNode
            label="Clinician review"
            sub="Accept · Edit · Reject"
            icon={ClipboardCheck}
            variant="review"
          />
        </div>

        <PipeArrow />

        <div className="aksh-interop-pipe__stage aksh-interop-pipe__stage--out">
          <InteropNode label="FHIR staging" sub="R4 · draft resources" icon={FileCode2} />
          <InteropNode label="SHIELD" sub="Audit trail" icon={Shield} />
        </div>
      </div>
    </figure>
  );
}
