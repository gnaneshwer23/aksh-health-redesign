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
  "Interoperability diagram: EMIS Web and SystmOne context feeds CANVAS intake. CONDUCTOR orchestrates parallel checks from SYNTHESIS, GUARDIAN, HORIZON, and PATHWAY. A clinician accepts, edits, or rejects every output before record staging (FHIR R4) and SHIELD audit. Clinician-approved only — not a live record write.";

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

/** Bold spruce/teal flow chevron — vertical ↓ or horizontal → */
function FlowArrow({
  direction = "down",
  label,
}: {
  direction?: "down" | "right";
  label?: string;
}) {
  const isDown = direction === "down";
  return (
    <div
      className={cn(
        "aksh-flow-arrow",
        isDown ? "aksh-flow-arrow--down" : "aksh-flow-arrow--right"
      )}
      aria-hidden
      data-testid={isDown ? "pipeline-arrow-down" : "pipeline-arrow-right"}
    >
      {label ? <span className="aksh-flow-arrow__label">{label}</span> : null}
      <svg
        className="aksh-flow-arrow__svg"
        viewBox={isDown ? "0 0 24 32" : "0 0 32 24"}
        width={isDown ? 24 : 32}
        height={isDown ? 32 : 24}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isDown ? (
          <>
            <path
              d="M12 2v18"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path d="M4 17l8 12 8-12H4z" fill="currentColor" />
          </>
        ) : (
          <>
            <path
              d="M2 12h18"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path d="M17 4l12 8-12 8V4z" fill="currentColor" />
          </>
        )}
      </svg>
    </div>
  );
}

/** Product illustration — EMR context → CANVAS → CONDUCTOR + parallel checks → clinician gate → FHIR + SHIELD. */
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

      <ol className="aksh-pipeline" data-testid="hero-agent-pipeline">
        <li className="aksh-pipeline__stage aksh-pipeline__stage--sources">
          <p className="aksh-pipeline__eyebrow">Clinical context</p>
          <div className="aksh-pipeline__sources">
            <span className="aksh-pipeline__source">EMIS Web</span>
            <span className="aksh-pipeline__source-dot" aria-hidden />
            <span className="aksh-pipeline__source">SystmOne</span>
          </div>
          <p className="aksh-pipeline__honesty">Designed for · not a live feed</p>
        </li>

        <li className="aksh-pipeline__connector" aria-hidden>
          <FlowArrow />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--intake">
          <InteropNode label="CANVAS" sub="Intake" icon={Mic} />
        </li>

        <li className="aksh-pipeline__connector" aria-hidden>
          <FlowArrow />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--hub">
          <InteropNode label="CONDUCTOR" sub="Orchestration hub" icon={Waypoints} variant="hub" />
        </li>

        <li className="aksh-pipeline__connector" aria-hidden>
          <FlowArrow label="parallel checks" />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--drafts">
          <div className="aksh-pipeline__drafts-band">
            <p className="aksh-pipeline__drafts-label">Parallel checks</p>
            <div className="aksh-pipeline__drafts">
              <InteropNode label="SYNTHESIS" sub="Documentation" icon={FileText} variant="compact" />
              <InteropNode label="GUARDIAN" sub="Drug safety" icon={Pill} variant="compact" />
              <InteropNode label="HORIZON" sub="Risk" icon={Activity} variant="compact" />
              <InteropNode label="PATHWAY" sub="Referral" icon={GitBranch} variant="compact" />
            </div>
          </div>
        </li>

        <li className="aksh-pipeline__connector" aria-hidden>
          <FlowArrow label="clinician decides" />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--gate">
          <InteropNode
            label="Clinician review"
            sub="Accept · Edit · Reject"
            icon={ClipboardCheck}
            variant="review"
          />
        </li>

        <li className="aksh-pipeline__connector" aria-hidden>
          <FlowArrow />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--out">
          <div className="aksh-pipeline__out-row">
            <InteropNode label="Record staging" sub="FHIR R4" icon={FileCode2} />
            <FlowArrow direction="right" />
            <InteropNode label="SHIELD" sub="Audit trail" icon={Shield} />
          </div>
          <p className="aksh-pipeline__footer-honesty">
            Clinician-approved only · not a live record write
          </p>
        </li>
      </ol>
    </figure>
  );
}
