/**
 * Original CSS/SVG visual anchors for scroll storytelling.
 * Inspired by Owkin's 3D-cell craft language — not their assets or trademarks.
 */

import type { CSSProperties, ReactNode } from "react";

export function PastelOrbVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`owkin-visual owkin-visual--orb ${className}`} aria-hidden>
      <div className="owkin-visual__orb-glow" />
      <div className="owkin-visual__orb-sphere" />
      <div className="owkin-visual__orb-shine" />
    </div>
  );
}

export function ClinicalCellVisual({ variant = "rose" }: { variant?: "rose" | "teal" | "amber" }) {
  return (
    <div className={`owkin-visual owkin-visual--cell owkin-visual--cell-${variant}`} aria-hidden>
      <div className="owkin-visual__cell-shell" />
      <div className="owkin-visual__cell-core" />
      <div className="owkin-visual__cell-fibers" />
      <div className="owkin-visual__cell-node owkin-visual__cell-node--a" />
      <div className="owkin-visual__cell-node owkin-visual__cell-node--b" />
    </div>
  );
}

export function FloatingChip({
  label,
  sub,
  style,
}: {
  label: string;
  sub?: string;
  style?: CSSProperties;
}) {
  return (
    <div className="owkin-float-chip" style={style}>
      <span className="owkin-float-chip__dot" aria-hidden />
      <div>
        <p className="owkin-float-chip__label">{label}</p>
        {sub ? <p className="owkin-float-chip__sub">{sub}</p> : null}
      </div>
    </div>
  );
}

export function PanelChip({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`owkin-panel-chip ${className}`}>
      <p className="owkin-panel-chip__title">{title}</p>
      {children}
    </div>
  );
}
