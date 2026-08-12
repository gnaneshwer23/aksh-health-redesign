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
  "Interoperability diagram: existing EHR context feeds clinical capture. An orchestration step runs parallel documentation, drug safety, risk, and referral checks. A clinician accepts, edits, or rejects every output before record staging (FHIR R4) and audit. Clinician-approved only — not a live record write.";

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
        viewBox={isDown ? "0 0 24 28" : "0 0 28 24"}
        width={isDown ? 20 : 26}
        height={isDown ? 26 : 20}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {isDown ? (
          <>
            <path
              d="M12 2v16"
              stroke="currentColor"
              strokeWidth="3.25"
              strokeLinecap="round"
            />
            <path d="M4.5 15.5l7.5 10.5 7.5-10.5H4.5z" fill="currentColor" />
          </>
        ) : (
          <>
            <path
              d="M2 12h16"
              stroke="currentColor"
              strokeWidth="3.25"
              strokeLinecap="round"
            />
            <path d="M15.5 4.5l10.5 7.5-10.5 7.5V4.5z" fill="currentColor" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Compact product board — sources, capture → orchestration,
 * parallel checks → clinician review → staging + audit.
 */
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
          <p className="aksh-pipeline__honesty">EHR examples · not a live feed</p>
        </li>

        <li className="aksh-pipeline__connector aksh-pipeline__connector--tight" aria-hidden>
          <FlowArrow />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--spine">
          <div className="aksh-pipeline__spine">
            <InteropNode label="Capture" sub="Intake" icon={Mic} />
            <FlowArrow direction="right" />
            <InteropNode label="Orchestrate" sub="Review coordination" icon={Waypoints} variant="hub" />
          </div>
        </li>

        <li className="aksh-pipeline__connector aksh-pipeline__connector--tight" aria-hidden>
          <FlowArrow label="parallel checks" />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--checks">
          <div className="aksh-pipeline__checks-band">
            <p className="aksh-pipeline__checks-label">Parallel checks</p>
            <div className="aksh-pipeline__checks">
              <InteropNode label="Documentation" sub="Clinical note" icon={FileText} variant="compact" />
              <InteropNode label="Drug safety" sub="Interactions" icon={Pill} variant="compact" />
              <InteropNode label="Risk" sub="Signals" icon={Activity} variant="compact" />
              <InteropNode label="Referral" sub="Pathway" icon={GitBranch} variant="compact" />
            </div>
          </div>
        </li>

        <li className="aksh-pipeline__connector aksh-pipeline__connector--tight" aria-hidden>
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

        <li className="aksh-pipeline__connector aksh-pipeline__connector--tight" aria-hidden>
          <FlowArrow />
        </li>

        <li className="aksh-pipeline__stage aksh-pipeline__stage--out">
          <div className="aksh-pipeline__out-row">
            <InteropNode label="Record staging" sub="FHIR R4" icon={FileCode2} />
            <FlowArrow direction="right" />
            <InteropNode label="Audit" sub="Immutable trail" icon={Shield} />
          </div>
          <p className="aksh-pipeline__footer-honesty">
            Clinician-approved only · not a live record write
          </p>
        </li>
      </ol>
    </figure>
  );
}
