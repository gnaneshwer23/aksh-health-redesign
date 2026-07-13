/**
 * Product-aligned marketing visuals for Aksh Health.
 * Atmosphere modes stay unlabeled so type never fights captions.
 * Scene modes are quiet product mocks — few labels, clear gaps, no spaghetti.
 */

import type { CSSProperties, ReactNode } from "react";

/** Soft unlabeled hub — safe behind / around type. Never includes readable captions. */
export function AtmosphereHubVisual({
  className = "",
  idPrefix = "hub",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const coreId = `aksh-${idPrefix}-core`;
  const pathId = `aksh-${idPrefix}-path`;

  return (
    <div className={`aksh-visual aksh-visual--hub aksh-visual--atmosphere ${className}`} aria-hidden>
      <div className="aksh-visual__hub-glow" />
      <div className="aksh-visual__hub-ring aksh-visual__hub-ring--outer" />
      <div className="aksh-visual__hub-ring aksh-visual__hub-ring--mid" />
      <svg className="aksh-visual__hub-svg" viewBox="0 0 320 320" fill="none">
        <defs>
          <linearGradient id={coreId} x1="80" y1="60" x2="240" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b7cff" />
            <stop offset="0.55" stopColor="#1f4bff" />
            <stop offset="1" stopColor="#1038d6" />
          </linearGradient>
          <linearGradient id={pathId} x1="40" y1="40" x2="280" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f4bff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#00a86b" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          className="aksh-visual__hub-arc"
          d="M70 160c0-55 40-95 90-95s90 40 90 95"
          stroke={`url(#${pathId})`}
          strokeWidth="1.25"
          strokeDasharray="4 8"
        />
        <path
          className="aksh-visual__hub-arc aksh-visual__hub-arc--delay"
          d="M55 200c15 50 55 80 105 80s90-30 105-80"
          stroke={`url(#${pathId})`}
          strokeWidth="1.25"
          strokeDasharray="3 9"
        />
        <g stroke="#1f4bff" strokeOpacity="0.12" strokeWidth="1">
          <line x1="160" y1="160" x2="88" y2="78" />
          <line x1="160" y1="160" x2="248" y2="92" />
          <line x1="160" y1="160" x2="264" y2="200" />
          <line x1="160" y1="160" x2="72" y2="214" />
          <line x1="160" y1="160" x2="160" y2="268" />
        </g>
        <g className="aksh-visual__hub-nodes" opacity="0.55">
          <g transform="translate(72 62)">
            <circle r="18" fill="#fff" stroke="rgba(20,20,20,0.06)" strokeWidth="1" />
            <circle r="5" fill="#1f4bff" opacity="0.2" />
          </g>
          <g transform="translate(248 78)">
            <circle r="18" fill="#fff" stroke="rgba(20,20,20,0.06)" strokeWidth="1" />
            <circle r="5" fill="#d97706" opacity="0.25" />
          </g>
          <g transform="translate(264 200)">
            <circle r="18" fill="#fff" stroke="rgba(20,20,20,0.06)" strokeWidth="1" />
            <circle r="5" fill="#1f4bff" opacity="0.2" />
          </g>
          <g transform="translate(72 214)">
            <circle r="18" fill="#fff" stroke="rgba(20,20,20,0.06)" strokeWidth="1" />
            <circle r="5" fill="#00a86b" opacity="0.25" />
          </g>
          <g transform="translate(160 268)">
            <circle r="16" fill="#fff" stroke="rgba(20,20,20,0.06)" strokeWidth="1" />
            <circle r="4.5" fill="#1038d6" opacity="0.2" />
          </g>
        </g>
        <circle cx="160" cy="160" r="36" fill={`url(#${coreId})`} className="aksh-visual__hub-core" opacity="0.85" />
        <circle cx="160" cy="160" r="36" fill={`url(#${coreId})`} opacity="0.2" className="aksh-visual__hub-core-pulse" />
      </svg>
      <div className="aksh-visual__hub-shine" />
    </div>
  );
}

/** Hero + vision: unlabeled atmosphere by default. Set labeled only in dedicated visual columns. */
export function PlatformHubVisual({
  className = "",
  idPrefix = "hub",
  atmosphere = false,
}: {
  className?: string;
  idPrefix?: string;
  /** When true, never render captions — safe behind headlines. */
  atmosphere?: boolean;
}) {
  if (atmosphere) {
    return <AtmosphereHubVisual className={className} idPrefix={idPrefix} />;
  }

  const coreId = `aksh-${idPrefix}-core`;
  const pathId = `aksh-${idPrefix}-path`;

  return (
    <div className={`aksh-visual aksh-visual--hub ${className}`} aria-hidden>
      <div className="aksh-visual__hub-glow" />
      <div className="aksh-visual__hub-ring aksh-visual__hub-ring--outer" />
      <div className="aksh-visual__hub-ring aksh-visual__hub-ring--mid" />
      <svg className="aksh-visual__hub-svg" viewBox="0 0 320 320" fill="none">
        <defs>
          <linearGradient id={coreId} x1="80" y1="60" x2="240" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b7cff" />
            <stop offset="0.55" stopColor="#1f4bff" />
            <stop offset="1" stopColor="#1038d6" />
          </linearGradient>
          <linearGradient id={pathId} x1="40" y1="40" x2="280" y2="280" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1f4bff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#00a86b" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path
          className="aksh-visual__hub-arc"
          d="M70 160c0-55 40-95 90-95s90 40 90 95"
          stroke={`url(#${pathId})`}
          strokeWidth="1.5"
          strokeDasharray="4 6"
        />
        <path
          className="aksh-visual__hub-arc aksh-visual__hub-arc--delay"
          d="M55 200c15 50 55 80 105 80s90-30 105-80"
          stroke={`url(#${pathId})`}
          strokeWidth="1.5"
          strokeDasharray="3 7"
        />
        <g stroke="#1f4bff" strokeOpacity="0.22" strokeWidth="1.25">
          <line x1="160" y1="160" x2="88" y2="78" />
          <line x1="160" y1="160" x2="248" y2="92" />
          <line x1="160" y1="160" x2="264" y2="200" />
          <line x1="160" y1="160" x2="72" y2="214" />
          <line x1="160" y1="160" x2="160" y2="268" />
        </g>
        <g className="aksh-visual__hub-nodes">
          <g transform="translate(72 62)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <circle r="7" fill="#1f4bff" opacity="0.15" />
            <path d="M-3 -4v8M-3 0h4a3.5 3.5 0 010 7h-2" stroke="#1f4bff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="5" cy="-6" r="2.2" fill="#00a86b" />
          </g>
          <g transform="translate(248 78)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <path
              d="M-8 6 L-2 -6 L4 2 L9 -8"
              stroke="#d97706"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="9" cy="-8" r="2.2" fill="#d97706" />
          </g>
          <g transform="translate(264 200)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <rect x="-9" y="-8" width="18" height="3.5" rx="1" fill="#1f4bff" opacity="0.85" />
            <rect x="-9" y="-2" width="14" height="3.5" rx="1" fill="#1f4bff" opacity="0.5" />
            <rect x="-9" y="4" width="11" height="3.5" rx="1" fill="#1f4bff" opacity="0.3" />
          </g>
          <g transform="translate(72 214)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <path d="M-7 -2h14M-7 3h10" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="-6" r="5" fill="none" stroke="#00a86b" strokeWidth="1.6" />
            <path d="M6 -9v3h3" stroke="#00a86b" strokeWidth="1.4" strokeLinecap="round" />
          </g>
          <g transform="translate(160 268)">
            <circle r="20" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <circle cx="-5" cy="-2" r="3.2" fill="#00a86b" opacity="0.7" />
            <circle cx="5" cy="-2" r="3.2" fill="#1f4bff" opacity="0.7" />
            <circle cx="0" cy="5" r="3.2" fill="#d97706" opacity="0.65" />
          </g>
        </g>
        <circle cx="160" cy="160" r="42" fill={`url(#${coreId})`} className="aksh-visual__hub-core" />
        <circle cx="160" cy="160" r="42" fill={`url(#${coreId})`} opacity="0.35" className="aksh-visual__hub-core-pulse" />
      </svg>
      <div className="aksh-visual__hub-shine" />
    </div>
  );
}

/** @deprecated Prefer PlatformHubVisual — kept for soft alias during migration */
export function PastelOrbVisual({ className = "" }: { className?: string }) {
  return <PlatformHubVisual className={className} idPrefix="orb" atmosphere />;
}

type SceneVariant = "fragmented" | "agents" | "fhir";

/** Scroll-story centre visuals mapped to product scenes. */
export function ProductSceneVisual({ variant }: { variant: SceneVariant }) {
  if (variant === "fragmented") return <FragmentedSystemsVisual />;
  if (variant === "agents") return <AgentGovernanceVisual />;
  return <FhirStagingVisual />;
}

/** Back-compat wrapper used by older imports */
export function ClinicalCellVisual({
  variant = "rose",
}: {
  variant?: "rose" | "teal" | "amber" | SceneVariant;
}) {
  const mapped: SceneVariant =
    variant === "amber" || variant === "fragmented"
      ? "fragmented"
      : variant === "rose" || variant === "agents"
        ? "agents"
        : "fhir";
  return <ProductSceneVisual variant={mapped} />;
}

function FragmentedSystemsVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--fragmented" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--amber" />
      <svg className="aksh-visual__scene-svg" viewBox="0 0 280 280" fill="none">
        <rect x="24" y="48" width="88" height="64" rx="12" fill="#fff" stroke="rgba(20,20,20,0.08)" />
        <text x="68" y="72" textAnchor="middle" fill="#141414" fontSize="9" fontWeight="700">
          EMIS Web
        </text>
        <text x="68" y="88" textAnchor="middle" fill="rgba(20,20,20,0.45)" fontSize="7">
          notes · meds
        </text>
        <rect x="168" y="36" width="88" height="64" rx="12" fill="#fff" stroke="rgba(20,20,20,0.08)" />
        <text x="212" y="60" textAnchor="middle" fill="#141414" fontSize="9" fontWeight="700">
          SystmOne
        </text>
        <text x="212" y="76" textAnchor="middle" fill="rgba(20,20,20,0.45)" fontSize="7">
          appointments
        </text>
        <rect x="96" y="148" width="88" height="64" rx="12" fill="#fff" stroke="rgba(20,20,20,0.08)" />
        <text x="140" y="172" textAnchor="middle" fill="#141414" fontSize="9" fontWeight="700">
          Inbox
        </text>
        <text x="140" y="188" textAnchor="middle" fill="rgba(20,20,20,0.45)" fontSize="7">
          handovers · chaos
        </text>
        <path d="M112 80 L168 68" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.7" />
        <path d="M80 112 L120 148" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.55" />
        <path d="M200 100 L160 148" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 5" opacity="0.55" />
        <circle cx="140" cy="118" r="14" fill="#faf7f2" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2 3" />
        <text x="140" y="121" textAnchor="middle" fill="#d97706" fontSize="14" fontWeight="700">
          ?
        </text>
      </svg>
    </div>
  );
}

/** Quiet review-queue mock — 4 labels max, no radial spokes. */
function AgentGovernanceVisual() {
  const rows = [
    { agent: "VOICE", detail: "Consult transcript", tone: "#00a86b" },
    { agent: "ORACLE", detail: "14-day risk · 82", tone: "#d97706" },
    { agent: "SHIELD", detail: "Audit trail on", tone: "#64748b" },
    { agent: "SYNTHESIS", detail: "SOAP draft ready", tone: "#1f4bff" },
  ] as const;

  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--agents-mock" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--rose" />
      <div className="aksh-mock-frame">
        <div className="aksh-mock-frame__chrome">
          <span className="aksh-mock-frame__dot" />
          <span className="aksh-mock-frame__title">Review queue</span>
          <span className="aksh-mock-frame__badge">Human gate</span>
        </div>
        <ul className="aksh-mock-queue">
          {rows.map((row) => (
            <li key={row.agent} className="aksh-mock-queue__row">
              <span className="aksh-mock-queue__dot" style={{ background: row.tone }} />
              <span className="aksh-mock-queue__agent">{row.agent}</span>
              <span className="aksh-mock-queue__detail">{row.detail}</span>
            </li>
          ))}
        </ul>
        <div className="aksh-mock-frame__actions">
          <span>Accept</span>
          <span>Edit</span>
          <span>Reject</span>
        </div>
      </div>
    </div>
  );
}

/** Stacked product panels — clear gaps, no absolute overlap. */
function FhirStagingVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--fhir-mock" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--teal" />
      <div className="aksh-mock-stack">
        <div className="aksh-mock-panel">
          <p className="aksh-mock-panel__eyebrow">Clinician queue</p>
          <div className="owkin-mini-graph" aria-hidden>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="aksh-mock-panel__meta">Accept · edit · reject</p>
        </div>
        <div className="aksh-mock-panel">
          <p className="aksh-mock-panel__eyebrow">FHIR staging</p>
          <div className="owkin-filter-pills" aria-hidden>
            {["Encounter", "Medication", "Condition", "AuditEvent"].map((pill) => (
              <span key={pill}>{pill}</span>
            ))}
          </div>
          <p className="aksh-mock-panel__meta">R4 · EMIS / SystmOne</p>
        </div>
      </div>
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

/** Compact motif for What’s new cards */
export function NewsCardMotif({ tone }: { tone: "navy" | "mint" | "ink" }) {
  if (tone === "navy") {
    return (
      <svg className="aksh-news-motif" viewBox="0 0 120 64" fill="none" aria-hidden>
        <rect x="8" y="12" width="72" height="10" rx="3" fill="rgba(255,255,255,0.35)" />
        <rect x="8" y="28" width="56" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
        <rect x="8" y="42" width="40" height="8" rx="3" fill="rgba(255,255,255,0.14)" />
        <circle cx="100" cy="32" r="16" fill="rgba(255,255,255,0.18)" />
        <path d="M94 32h12M100 26v12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (tone === "mint") {
    return (
      <svg className="aksh-news-motif" viewBox="0 0 120 64" fill="none" aria-hidden>
        <circle cx="30" cy="32" r="18" fill="rgba(0,168,107,0.2)" />
        <circle cx="54" cy="32" r="18" fill="rgba(31,75,255,0.15)" />
        <circle cx="78" cy="32" r="18" fill="rgba(217,119,6,0.15)" />
        <path d="M20 48c12-8 28-8 40 0" stroke="#00a86b" strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg className="aksh-news-motif" viewBox="0 0 120 64" fill="none" aria-hidden>
      <rect x="12" y="10" width="96" height="44" rx="8" fill="#f3efe8" />
      <rect x="24" y="22" width="28" height="4" rx="1" fill="#1f4bff" opacity="0.7" />
      <rect x="24" y="32" width="48" height="4" rx="1" fill="rgba(20,20,20,0.2)" />
      <rect x="24" y="42" width="36" height="4" rx="1" fill="rgba(20,20,20,0.12)" />
      <circle cx="92" cy="32" r="10" stroke="#1038d6" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
