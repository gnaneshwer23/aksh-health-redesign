"use client";

import {
  COMPASS_CAPABILITIES,
  COMPASS_HONESTY_LINES,
  COMPASS_NON_CLAIMS,
} from "@/lib/agents/compass-honesty";

/**
 * Milestone C5 — thin honesty chrome for COMPASS / ICS brief surfaces.
 * Mirrors C2 review-honesty tone without claiming certified ICS routing.
 */
export function CompassHonestyStrip({
  surface = "COMPASS population brief",
}: {
  surface?: string;
}) {
  return (
    <div
      role="status"
      className="space-y-2 rounded-md border border-amber-300/60 bg-amber-50/40 px-3 py-2 text-[11px] text-amber-950/90"
      data-testid="compass-honesty-strip"
      data-surface={surface}
      data-decision-support="true"
      data-sandbox="true"
      data-certified-ics-routing="false"
      data-clinical-validation-claim="false"
      data-ehr-write="false"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold tracking-tight">{surface}</span>
        <span
          className="rounded bg-amber-100/80 px-1.5 py-0.5 font-medium"
          data-testid="compass-honesty-decision-support"
        >
          decision-support
        </span>
        <span className="rounded bg-amber-100/80 px-1.5 py-0.5 font-medium" data-testid="compass-honesty-sandbox">
          sandbox
        </span>
        <span className="rounded bg-amber-100/80 px-1.5 py-0.5">HITL · ehrWrite:false</span>
        <span className="rounded bg-amber-100/80 px-1.5 py-0.5">
          alias {COMPASS_CAPABILITIES.legacyAlias} → {COMPASS_CAPABILITIES.productLabel}
        </span>
      </div>
      <ul className="list-disc space-y-0.5 pl-4 text-muted" data-testid="compass-honesty-lines">
        {COMPASS_HONESTY_LINES.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-[10px] text-muted" data-testid="compass-honesty-non-claims">
        Non-claims: {COMPASS_NON_CLAIMS.join(" · ")}
      </p>
    </div>
  );
}
