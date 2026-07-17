import { cn } from "@/lib/utils";

const ARIA_LABEL =
  "Interoperability diagram: EMIS Web and SystmOne connect to Aksh Health care coordination. Clinicians review every output before FHIR staging and SHIELD audit logging.";

type InteropNodeProps = {
  label: string;
  sub?: string;
  variant?: "default" | "hub" | "review";
  badge?: string;
  className?: string;
};

function InteropNode({ label, sub, variant = "default", badge, className }: InteropNodeProps) {
  return (
    <div
      className={cn(
        "aksh-interop-node",
        variant === "hub" && "aksh-interop-node--hub",
        variant === "review" && "aksh-interop-node--review",
        className
      )}
    >
      {badge ? <span className="aksh-interop-node__badge">{badge}</span> : null}
      <p className="aksh-interop-node__label">{label}</p>
      {sub ? <p className="aksh-interop-node__sub">{sub}</p> : null}
    </div>
  );
}

/** Product-style hub diagram — straight connectors, labelled nodes, shared frame tokens. */
export function InteroperabilityDiagram({ className }: { className?: string }) {
  return (
    <figure className={cn("aksh-interop-diagram marketing-frame", className)} aria-label={ARIA_LABEL}>
      <figcaption className="sr-only">{ARIA_LABEL}</figcaption>

      <svg
        className="aksh-interop-diagram__connectors"
        viewBox="0 0 360 300"
        fill="none"
        aria-hidden
        preserveAspectRatio="xMidYMid meet"
      >
        {/* EMIS Web → hub */}
        <path d="M 72 44 L 72 68 L 180 68 L 180 92" stroke="currentColor" strokeWidth="1.5" />
        {/* SystmOne → hub */}
        <path d="M 288 44 L 288 68 L 180 68" stroke="currentColor" strokeWidth="1.5" />
        {/* Hub → clinician review */}
        <path d="M 180 148 L 180 168" stroke="currentColor" strokeWidth="1.5" />
        {/* Review → FHIR staging */}
        <path d="M 180 216 L 180 236 L 72 236 L 72 252" stroke="currentColor" strokeWidth="1.5" />
        {/* Review → SHIELD audit */}
        <path d="M 180 216 L 180 236 L 288 236 L 288 252" stroke="currentColor" strokeWidth="1.5" />
        {/* Connector junction dots */}
        <circle cx="180" cy="68" r="3" fill="currentColor" />
        <circle cx="180" cy="236" r="3" fill="currentColor" />
      </svg>

      <div className="aksh-interop-diagram__grid">
        <InteropNode label="EMIS Web" sub="Primary care" className="aksh-interop-diagram__emis" />
        <InteropNode label="SystmOne" sub="Primary care" className="aksh-interop-diagram__systm" />
        <InteropNode
          label="Aksh Health"
          sub="Care coordination"
          variant="hub"
          className="aksh-interop-diagram__hub"
        />
        <InteropNode
          label="Clinician review"
          sub="Accept · edit · reject"
          variant="review"
          badge="You"
          className="aksh-interop-diagram__review"
        />
        <InteropNode label="FHIR staging" sub="R4 · draft resources" className="aksh-interop-diagram__fhir" />
        <InteropNode label="SHIELD audit" sub="Immutable trail" className="aksh-interop-diagram__shield" />
      </div>
    </figure>
  );
}
