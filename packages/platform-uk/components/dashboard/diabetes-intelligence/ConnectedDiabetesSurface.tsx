"use client";

import type { CSSProperties, ReactNode } from "react";

import {
  CONNECTED_DIABETES_PAGE_CLASS,
  connectedDiabetesCssVars,
} from "@/lib/diabetes-intelligence/connected-diabetes-tokens";

type Props = {
  children: ReactNode;
  className?: string;
  /** When true, announces loading to assistive tech (UX-03/04 a11y). */
  busy?: boolean;
  busyLabel?: string;
};

/**
 * UX-04 page shell — one token surface for Connected Diabetes routes.
 * Replaces per-page `style={{ background: "#f7fafc" }}` drift.
 */
export function ConnectedDiabetesSurface({
  children,
  className,
  busy = false,
  busyLabel = "Loading connected diabetes workspace",
}: Props) {
  return (
    <div
      className={[CONNECTED_DIABETES_PAGE_CLASS, className].filter(Boolean).join(" ")}
      style={connectedDiabetesCssVars as CSSProperties}
      data-testid="connected-diabetes-surface"
      aria-busy={busy || undefined}
    >
      {busy ? (
        <p className="sr-only" role="status" aria-live="polite">
          {busyLabel}
        </p>
      ) : null}
      {children}
    </div>
  );
}
