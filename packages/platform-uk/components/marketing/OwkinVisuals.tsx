/**
 * Product-aligned marketing visuals for Aksh Health.
 * Crisp UI frames drawn from demo/dashboard patterns — few labels, clear gaps.
 * Atmosphere modes stay unlabeled so type never fights captions.
 */

import type { CSSProperties, ReactNode } from "react";

/** Soft unlabeled wash — safe behind / around type. Never includes readable captions. */
export function AtmosphereHubVisual({
  className = "",
}: {
  className?: string;
  idPrefix?: string;
}) {
  return (
    <div className={`aksh-visual aksh-visual--atmosphere-wash ${className}`} aria-hidden>
      <div className="aksh-atmosphere-wash__blob aksh-atmosphere-wash__blob--a" />
      <div className="aksh-atmosphere-wash__blob aksh-atmosphere-wash__blob--b" />
      <div className="aksh-atmosphere-wash__mesh" />
    </div>
  );
}

/** Hero product frame — sits below headlines, never behind type. */
export function HeroProductVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`aksh-hero-product ${className}`} aria-hidden>
      <div className="aksh-hero-product__main">
        <div className="aksh-mock-frame aksh-mock-frame--hero">
          <div className="aksh-mock-frame__chrome">
            <span className="aksh-mock-frame__dot" />
            <span className="aksh-mock-frame__title">Clinical queue</span>
            <span className="aksh-mock-frame__badge">Named review</span>
          </div>
          <ul className="aksh-mock-queue">
            <li className="aksh-mock-queue__row">
              <span className="aksh-mock-queue__dot" />
              <span className="aksh-mock-queue__agent">VOICE</span>
              <span className="aksh-mock-queue__detail">Consult · Mr J. Patel</span>
            </li>
            <li className="aksh-mock-queue__row">
              <span className="aksh-mock-queue__dot" />
              <span className="aksh-mock-queue__agent">SOAP</span>
              <span className="aksh-mock-queue__detail">Draft awaiting GP</span>
            </li>
            <li className="aksh-mock-queue__row">
              <span className="aksh-mock-queue__dot" />
              <span className="aksh-mock-queue__agent">Risk Signals</span>
              <span className="aksh-mock-queue__detail">14-day risk · 82</span>
            </li>
            <li className="aksh-mock-queue__row">
              <span className="aksh-mock-queue__dot" />
              <span className="aksh-mock-queue__agent">SHIELD</span>
              <span className="aksh-mock-queue__detail">Audit trail on</span>
            </li>
          </ul>
          <div className="aksh-mock-frame__actions">
            <span>Accept</span>
            <span>Edit</span>
            <span>Reject</span>
          </div>
        </div>
      </div>
      <div className="aksh-hero-product__side">
        <OracleRiskCard />
        <ShieldAuditCard compact />
      </div>
    </div>
  );
}

/** @deprecated Prefer PlatformHubVisual — kept for soft alias during migration */
export function PlatformHubVisual({
  className = "",
  idPrefix = "hub",
  atmosphere = false,
}: {
  className?: string;
  idPrefix?: string;
  atmosphere?: boolean;
}) {
  if (atmosphere) {
    return <AtmosphereHubVisual className={className} idPrefix={idPrefix} />;
  }
  return <HeroProductVisual className={className} />;
}

/** @deprecated Prefer AtmosphereHubVisual */
export function PastelOrbVisual({ className = "" }: { className?: string }) {
  return <AtmosphereHubVisual className={className} />;
}

type SceneVariant = "fragmented" | "agents" | "fhir" | "voice" | "oracle" | "shield";

/** Scroll-story centre visuals mapped to product scenes. */
export function ProductSceneVisual({ variant }: { variant: SceneVariant }) {
  if (variant === "fragmented") return <FragmentedSystemsVisual />;
  if (variant === "agents" || variant === "voice") return <VoiceConsultVisual />;
  if (variant === "oracle") return <OracleSceneVisual />;
  if (variant === "shield") return <ShieldSceneVisual />;
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
      : variant === "rose" || variant === "agents" || variant === "voice"
        ? "agents"
        : variant === "oracle"
          ? "oracle"
          : variant === "shield"
            ? "shield"
            : "fhir";
  return <ProductSceneVisual variant={mapped} />;
}

function FragmentedSystemsVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--fragmented" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--amber" />
      <div className="aksh-mock-frame">
        <div className="aksh-mock-frame__chrome">
          <span className="aksh-mock-frame__dot" />
          <span className="aksh-mock-frame__title">Scattered systems</span>
        </div>
        <div className="aksh-mock-scatter">
          <div className="aksh-mock-scatter__card">
            <p>EMIS Web</p>
            <span>notes · meds</span>
          </div>
          <div className="aksh-mock-scatter__card">
            <p>SystmOne</p>
            <span>appointments</span>
          </div>
          <div className="aksh-mock-scatter__card aksh-mock-scatter__card--warn">
            <p>Inbox</p>
            <span>handovers · chaos</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Voice consult → governed queue — matches GP dashboard / Patel demo patterns. */
function VoiceConsultVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--agents-mock" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--rose" />
      <div className="aksh-mock-frame">
        <div className="aksh-mock-frame__chrome">
          <span className="aksh-mock-frame__dot" />
          <span className="aksh-mock-frame__title">Voice consult</span>
          <span className="aksh-mock-frame__badge">In progress</span>
        </div>
        <div className="aksh-mock-voice">
          <div className="aksh-mock-voice__wave" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <p className="aksh-mock-voice__line">“…calf swelling since Tuesday, sugars running 12 to 14…”</p>
        </div>
        <ul className="aksh-mock-queue aksh-mock-queue--compact">
          <li className="aksh-mock-queue__row">
            <span className="aksh-mock-queue__dot" />
            <span className="aksh-mock-queue__agent">Documentation</span>
            <span className="aksh-mock-queue__detail">SOAP draft ready</span>
          </li>
          <li className="aksh-mock-queue__row">
            <span className="aksh-mock-queue__dot" />
            <span className="aksh-mock-queue__agent">Risk Signals</span>
            <span className="aksh-mock-queue__detail">Risk flagged</span>
          </li>
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

function OracleSceneVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--agents-mock" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--amber" />
      <OracleRiskCard />
    </div>
  );
}

function ShieldSceneVisual() {
  return (
    <div className="aksh-visual aksh-visual--scene aksh-visual--agents-mock" aria-hidden>
      <div className="aksh-visual__scene-glow aksh-visual__scene-glow--teal" />
      <ShieldAuditCard />
    </div>
  );
}

function OracleRiskCard() {
  return (
    <div className="aksh-mock-frame aksh-mock-oracle">
      <div className="aksh-mock-frame__chrome">
        <span className="aksh-mock-frame__dot" />
        <span className="aksh-mock-frame__title">Risk Signals risk</span>
        <span className="aksh-mock-frame__badge aksh-mock-frame__badge--warn">High</span>
      </div>
      <div className="aksh-mock-oracle__score">
        <span className="aksh-mock-oracle__value">82</span>
        <div>
          <p className="aksh-mock-oracle__label">14-day admission risk</p>
          <p className="aksh-mock-oracle__delta">78 → 82 · review recommended</p>
        </div>
      </div>
      <ul className="aksh-mock-oracle__factors">
        <li>Calf swelling · DVT pathway</li>
        <li>Glycaemic range 12–14</li>
      </ul>
    </div>
  );
}

function ShieldAuditCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`aksh-mock-frame aksh-mock-shield${compact ? " aksh-mock-shield--compact" : ""}`}>
      <div className="aksh-mock-frame__chrome">
        <span className="aksh-mock-frame__dot" />
        <span className="aksh-mock-frame__title">SHIELD audit</span>
        <span className="aksh-mock-frame__badge">Clear</span>
      </div>
      <ul className="aksh-mock-shield__events">
        <li>
          <span>09:41</span>
          <span>Draft staged · no auto-write</span>
        </li>
        <li>
          <span>09:44</span>
          <span>GP Accept · AuditEvent</span>
        </li>
        {!compact ? (
          <li>
            <span>ETL</span>
            <span>Midnight run · Verified</span>
          </li>
        ) : null}
      </ul>
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
        <ShieldAuditCard compact />
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
        <circle cx="30" cy="32" r="18" fill="rgba(7,95,80,0.2)" />
        <circle cx="54" cy="32" r="18" fill="rgba(7,95,80,0.12)" />
        <circle cx="78" cy="32" r="18" fill="rgba(16,33,29,0.09)" />
        <path d="M20 48c12-8 28-8 40 0" stroke="var(--mk-accent)" strokeWidth="1.5" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg className="aksh-news-motif" viewBox="0 0 120 64" fill="none" aria-hidden>
      <rect x="12" y="10" width="96" height="44" rx="8" fill="var(--mk-surface)" />
      <rect x="24" y="22" width="28" height="4" rx="1" fill="var(--mk-accent)" opacity="0.7" />
      <rect x="24" y="32" width="48" height="4" rx="1" fill="rgba(20,20,20,0.2)" />
      <rect x="24" y="42" width="36" height="4" rx="1" fill="rgba(20,20,20,0.12)" />
      <circle cx="92" cy="32" r="10" stroke="var(--mk-accent)" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
