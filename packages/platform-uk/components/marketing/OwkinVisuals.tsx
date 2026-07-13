/**
 * Product-aligned marketing visuals for Aksh Health.
 * Illustrative system: NHS pathways, voice, risk, queues, FHIR, audit —
 * not abstract biotech cells. Layout craft remains editorial cream.
 */

import type { CSSProperties, ReactNode } from "react";

/** Hero + vision: clinical platform hub with orbiting capabilities. */
export function PlatformHubVisual({
  className = "",
  idPrefix = "hub",
}: {
  className?: string;
  idPrefix?: string;
}) {
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
        {/* Pathway arcs — UK care coordination */}
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
        {/* Spoke lines to capability nodes */}
        <g stroke="#1f4bff" strokeOpacity="0.22" strokeWidth="1.25">
          <line x1="160" y1="160" x2="88" y2="78" />
          <line x1="160" y1="160" x2="248" y2="92" />
          <line x1="160" y1="160" x2="264" y2="200" />
          <line x1="160" y1="160" x2="72" y2="214" />
          <line x1="160" y1="160" x2="160" y2="268" />
        </g>
        {/* Capability nodes */}
        <g className="aksh-visual__hub-nodes">
          {/* Voice consult */}
          <g transform="translate(72 62)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <circle r="7" fill="#1f4bff" opacity="0.15" />
            <path d="M-3 -4v8M-3 0h4a3.5 3.5 0 010 7h-2" stroke="#1f4bff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="5" cy="-6" r="2.2" fill="#00a86b" />
          </g>
          {/* ORACLE risk */}
          <g transform="translate(248 78)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <path d="M-8 6 L-2 -6 L4 2 L9 -8" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="9" cy="-8" r="2.2" fill="#d97706" />
          </g>
          {/* Review queue */}
          <g transform="translate(264 200)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <rect x="-9" y="-8" width="18" height="3.5" rx="1" fill="#1f4bff" opacity="0.85" />
            <rect x="-9" y="-2" width="14" height="3.5" rx="1" fill="#1f4bff" opacity="0.5" />
            <rect x="-9" y="4" width="11" height="3.5" rx="1" fill="#1f4bff" opacity="0.3" />
          </g>
          {/* Midnight ETL / intake */}
          <g transform="translate(72 214)">
            <circle r="22" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <path d="M-7 -2h14M-7 3h10" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="6" cy="-6" r="5" fill="none" stroke="#00a86b" strokeWidth="1.6" />
            <path d="M6 -9v3h3" stroke="#00a86b" strokeWidth="1.4" strokeLinecap="round" />
          </g>
          {/* Population / EQUITY */}
          <g transform="translate(160 268)">
            <circle r="20" fill="#fff" stroke="rgba(20,20,20,0.08)" strokeWidth="1" />
            <circle cx="-5" cy="-2" r="3.2" fill="#00a86b" opacity="0.7" />
            <circle cx="5" cy="-2" r="3.2" fill="#1f4bff" opacity="0.7" />
            <circle cx="0" cy="5" r="3.2" fill="#d97706" opacity="0.65" />
          </g>
        </g>
        {/* Core — clinician HITL gate */}
        <circle cx="160" cy="160" r="42" fill={`url(#${coreId})`} className="aksh-visual__hub-core" />
        <circle cx="160" cy="160" r="42" fill={`url(#${coreId})`} opacity="0.35" className="aksh-visual__hub-core-pulse" />
        <text x="160" y="154" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" letterSpacing="0.12em">
          HITL
        </text>
        <text x="160" y="170" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="7.5" fontWeight="500">
          clinician gate
        </text>
      </svg>
      <div className="aksh-visual__hub-shine" />
    </div>
  );
}

/** @deprecated Prefer PlatformHubVisual — kept for soft alias during migration */
export function PastelOrbVisual({ className = "" }: { className?: string }) {
  return <PlatformHubVisual className={className} idPrefix="orb" />;
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
        {/* Broken / dashed links */}
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

function AgentGovernanceVisual() {
  const agents = [
    { x: 140, y: 42, label: "SYNTHESIS", color: "#1f4bff" },
    { x: 228, y: 96, label: "ORACLE", color: "#d97706" },
    { x: 218, y: 196, label: "SHIELD", color: "#64748b" },
    { x: 62, y: 196, label: "GUARDIAN", color: "#dc2626" },
    { x: 52, y: 96, label: "REFERRAL", color: "#1038d6" },
    { x: 140, y: 238, label: "VOICE", color: "#00a86b" },
  ] as const;

  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--agents" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--rose" />
      <svg className="aksh-visual__scene-svg" viewBox="0 0 280 280" fill="none">
        <defs>
          <linearGradient id="aksh-agent-core" x1="100" y1="100" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5b7cff" />
            <stop offset="1" stopColor="#1f4bff" />
          </linearGradient>
        </defs>
        <circle
          cx="140"
          cy="140"
          r="78"
          stroke="rgba(31,75,255,0.18)"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="aksh-visual__spin-slow"
        />
        {agents.map((node) => (
          <line
            key={`spoke-${node.label}`}
            x1="140"
            y1="140"
            x2={node.x}
            y2={node.y}
            stroke={node.color}
            strokeOpacity="0.28"
            strokeWidth="1.2"
          />
        ))}
        {agents.map((node) => (
          <g key={node.label} transform={`translate(${node.x} ${node.y})`}>
            <rect x="-34" y="-11" width="68" height="22" rx="11" fill="#fff" stroke="rgba(20,20,20,0.08)" />
            <circle cx="-22" cy="0" r="3.5" fill={node.color} />
            <text x="4" y="3.5" textAnchor="middle" fill="#141414" fontSize="7" fontWeight="700">
              {node.label}
            </text>
          </g>
        ))}
        <circle cx="140" cy="140" r="36" fill="url(#aksh-agent-core)" className="aksh-visual__hub-core" />
        <text x="140" y="136" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" letterSpacing="0.08em">
          REVIEW
        </text>
        <text x="140" y="150" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="7">
          accept · edit · reject
        </text>
      </svg>
    </div>
  );
}

function FhirStagingVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--fhir" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--teal" />
      <svg className="aksh-visual__scene-svg" viewBox="0 0 280 280" fill="none">
        {/* Audit trail spine */}
        <path
          d="M48 60v160"
          stroke="#00a86b"
          strokeWidth="2"
          strokeDasharray="2 6"
          className="aksh-visual__audit-dash"
        />
        {[70, 120, 170, 220].map((y, i) => (
          <circle key={y} cx="48" cy={y} r="5" fill={i === 3 ? "#00a86b" : "#fff"} stroke="#00a86b" strokeWidth="1.5" />
        ))}
        <text x="48" y="48" textAnchor="middle" fill="#00a86b" fontSize="7" fontWeight="700">
          SHIELD
        </text>
        {/* FHIR resource stack */}
        {[
          { y: 58, label: "Encounter", delay: "0s" },
          { y: 108, label: "Condition", delay: "0.15s" },
          { y: 158, label: "MedicationRequest", delay: "0.3s" },
          { y: 208, label: "AuditEvent", delay: "0.45s" },
        ].map((row) => (
          <g key={row.label} style={{ animationDelay: row.delay }} className="aksh-visual__fhir-card">
            <rect x="78" y={row.y} width="160" height="36" rx="10" fill="#fff" stroke="rgba(20,20,20,0.08)" />
            <rect x="90" y={row.y + 12} width="8" height="12" rx="2" fill="#1f4bff" opacity="0.85" />
            <text x="108" y={row.y + 22} fill="#141414" fontSize="9" fontWeight="650">
              {row.label}
            </text>
            <text x="220" y={row.y + 22} textAnchor="end" fill="rgba(20,20,20,0.4)" fontSize="7">
              R4 · staged
            </text>
          </g>
        ))}
        <path d="M238 76h16M246 68v16" stroke="#1f4bff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
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
