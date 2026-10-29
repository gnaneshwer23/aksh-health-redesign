"use client";

/**
 * "The review line": the agent loop as an isometric production line. Patient data enters, passes intake, then
 * specialist benches in parallel (plus coding after), and stops at a raised clinician checkpoint. Only accepted work
 * moves to coordination and staging; Shield audits beside the line and the Orchestrator oversees it. Stations are
 * focusable; the readout explains them. Motion stops under prefers-reduced-motion. Copy and statuses come from
 * components/site/agents-content.ts (backed by the agent register) — nothing here implies production clinical AI.
 */
import { useEffect, useMemo, useState } from "react";

import { PUBLIC_AGENTS, type PublicAgent } from "@/components/site/agents-content";

const S = 46;
const COS = 0.866;
type Pt = [number, number];
const iso = (x: number, y: number, z = 0): Pt => [(x - y) * S * COS, (x + y) * S * 0.5 - z * S];
const pts = (p: Pt[]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

type Kind = "dock" | "intake" | "bench" | "gate" | "out" | "tower" | "ledger" | "aggregate" | "planned";
type Station = {
  key: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  kind: Kind;
  label: string;
  agent?: PublicAgent;
  /** Extra screen-space nudge for the floating label (avoids collisions in dense clusters). */
  labelNudge?: Pt;
};

const FACE: Record<Kind, { top: string; left: string; right: string; ink: string }> = {
  dock: { top: "#e7eadb", left: "#d7dcc6", right: "#cbd1b8", ink: "#2d3431" },
  intake: { top: "#e6eeea", left: "#cfdcd6", right: "#bccfc6", ink: "#1e4d52" },
  bench: { top: "#2f6a6e", left: "#1e4d52", right: "#173d41", ink: "#ffffff" },
  gate: { top: "#dcef55", left: "#c3cc6a", right: "#aab354", ink: "#121715" },
  out: { top: "#f1f8c4", left: "#dfe7a8", right: "#cdd68f", ink: "#121715" },
  tower: { top: "#2d3431", left: "#121715", right: "#0b0f0d", ink: "#ffffff" },
  ledger: { top: "#3a4340", left: "#262d2a", right: "#1b211e", ink: "#ffffff" },
  aggregate: { top: "#e7eadb", left: "#d2d6c2", right: "#c2c7b0", ink: "#2d3431" },
  planned: { top: "transparent", left: "transparent", right: "transparent", ink: "#62685f" },
};

const byId = (id: string) => PUBLIC_AGENTS.find((a) => a.id === id)!;

/**
 * Left → right columns: intake → parallel draft/check → coding → clinician gate → after-accept → planned.
 * Infrastructure (Orchestrator, Shield) sits behind the line, shorter than the gate so the checkpoint stays the hero.
 * y-spacing in the specialist column is wide enough that isometric labels do not collide.
 */
const STATIONS: Station[] = [
  { key: "dock", x: 0.1, y: -0.15, w: 1.15, d: 1.15, h: 0.28, kind: "dock", label: "Patient data", labelNudge: [0, -4] },
  { key: "VOICE", x: 2.05, y: -1.15, w: 0.95, d: 0.95, h: 0.48, kind: "intake", label: "Voice", agent: byId("VOICE"), labelNudge: [-18, -6] },
  { key: "CANVAS", x: 2.05, y: 0.55, w: 0.95, d: 0.95, h: 0.48, kind: "intake", label: "Canvas", agent: byId("CANVAS"), labelNudge: [18, -6] },
  { key: "SYNTHESIS", x: 4.35, y: -2.95, w: 0.95, d: 0.8, h: 0.52, kind: "bench", label: "Synthesis", agent: byId("SYNTHESIS"), labelNudge: [-28, -10] },
  { key: "GUARDIAN", x: 4.35, y: -1.2, w: 0.95, d: 0.8, h: 0.52, kind: "bench", label: "Guardian", agent: byId("GUARDIAN"), labelNudge: [-6, -10] },
  { key: "HORIZON", x: 4.35, y: 0.55, w: 0.95, d: 0.8, h: 0.52, kind: "bench", label: "Horizon", agent: byId("HORIZON"), labelNudge: [6, -10] },
  { key: "NEXUS", x: 4.35, y: 2.3, w: 0.95, d: 0.8, h: 0.52, kind: "bench", label: "Nexus", agent: byId("NEXUS"), labelNudge: [28, -10] },
  { key: "DrASSIST", x: 6.35, y: 0.05, w: 0.9, d: 0.85, h: 0.48, kind: "bench", label: "DrAssist", agent: byId("DrASSIST"), labelNudge: [0, -12] },
  { key: "gate", x: 8.05, y: -0.55, w: 1.7, d: 1.7, h: 1.65, kind: "gate", label: "Clinician decides", labelNudge: [0, -22] },
  { key: "PATHWAY", x: 10.55, y: -1.55, w: 1.0, d: 1.0, h: 0.48, kind: "out", label: "Pathway", agent: byId("PATHWAY"), labelNudge: [-14, -6] },
  { key: "BRIDGE", x: 10.55, y: 0.35, w: 1.0, d: 1.0, h: 0.48, kind: "out", label: "Bridge", agent: byId("BRIDGE"), labelNudge: [14, -6] },
  { key: "CONDUCTOR", x: 4.55, y: -4.35, w: 0.8, d: 0.8, h: 1.5, kind: "tower", label: "Orchestrator", agent: byId("CONDUCTOR"), labelNudge: [0, -10] },
  { key: "SHIELD", x: 8.15, y: -3.95, w: 0.8, d: 0.8, h: 1.2, kind: "ledger", label: "Shield (audit)", agent: byId("SHIELD"), labelNudge: [10, -10] },
  { key: "COMPASS", x: 12.15, y: -2.75, w: 0.95, d: 0.95, h: 0.72, kind: "aggregate", label: "Compass", agent: byId("COMPASS"), labelNudge: [0, -8] },
  { key: "PRISM", x: 12.45, y: -0.55, w: 0.85, d: 0.85, h: 0.45, kind: "planned", label: "Prism (planned)", agent: byId("PRISM"), labelNudge: [-8, -4] },
  { key: "ATLAS", x: 12.45, y: 0.95, w: 0.85, d: 0.85, h: 0.45, kind: "planned", label: "Trials (planned)", agent: byId("ATLAS"), labelNudge: [8, -4] },
];

const FLOOR: Pt[] = [iso(-0.6, -5.0), iso(14.0, -5.0), iso(14.0, 3.55), iso(-0.6, 3.55)];

/** Zone pads under the floor groups (drawn first, under belts). Labels are chips — readable at a glance. */
const ZONES: {
  key: string;
  n?: string;
  label: string;
  corners: [number, number, number, number];
  ink: string;
  chipW: number;
}[] = [
  { key: "intake", n: "1", label: "Intake", corners: [-0.15, -1.55, 3.35, 1.85], ink: "#1e4d52", chipW: 78 },
  { key: "draft", n: "2", label: "Draft & check", corners: [3.9, -3.35, 7.55, 3.4], ink: "#1e4d52", chipW: 118 },
  { key: "decide", n: "3", label: "Clinician decides", corners: [7.75, -1.15, 9.95, 1.45], ink: "#3d4a00", chipW: 148 },
  { key: "after", n: "4", label: "After accept", corners: [10.1, -2.0, 11.7, 1.7], ink: "#3d4a00", chipW: 108 },
  { key: "infra", label: "Infrastructure", corners: [4.1, -4.75, 9.1, -3.2], ink: "#62685f", chipW: 112 },
];

/** HTML strip above the isometric floor — the change a reader notices first. */
const ZONE_STEPS: { n: string; label: string; hero?: boolean }[] = [
  { n: "1", label: "Intake" },
  { n: "2", label: "Draft & check" },
  { n: "3", label: "Clinician decides", hero: true },
  { n: "4", label: "After accept" },
];

const centre = (k: string, z = 0.02): Pt => {
  const s = STATIONS.find((x) => x.key === k)!;
  return iso(s.x + s.w / 2, s.y + s.d / 2, z);
};
const path = (...keys: string[]) => "M" + keys.map((k) => centre(k).map((n) => n.toFixed(1)).join(",")).join(" L");

const PRE = ["SYNTHESIS", "GUARDIAN", "HORIZON", "NEXUS"].map((b, i) => path("dock", i < 2 ? "VOICE" : "CANVAS", b, "DrASSIST", "gate"));
const POST_ACCEPT = [path("gate", "PATHWAY"), path("gate", "BRIDGE")];

const INFO: Record<string, { title: string; body: string; foot: string }> = {
  dock: {
    title: "Patient data in",
    body: "Schedules, CGM, laboratory results with their LOINC codes, medicines and readings patients choose to share. Every value keeps its source.",
    foot: "Read only: Aksh writes nothing back to your records system.",
  },
  gate: {
    title: "The clinician checkpoint",
    body: "Every draft stops here. A named clinician accepts, edits or rejects it, and decides urgent concerns, referrals and medication decisions at their own gates. Nothing passes without that decision.",
    foot: "Decided on the server under the signed-in account, with an audit record saved in the same step.",
  },
};

function statusMarkerClass(agent?: PublicAgent): string | null {
  if (!agent) return null;
  if (agent.status === "planned") return "s-line__mark s-line__mark--planned";
  if (agent.status === "production") return "s-line__mark s-line__mark--production";
  // in_validation and synthetic_demo — honest: not released for real patients
  return "s-line__mark s-line__mark--validation";
}

export function AgentLineFigure() {
  const [selected, setSelected] = useState<string>("gate");
  const [decision, setDecision] = useState<"waiting" | "accepted" | "rejected">("waiting");
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: no-preference)");
    setMotion(m.matches);
    const on = () => setMotion(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);

  const box = useMemo(() => {
    const all = [...FLOOR, ...STATIONS.flatMap((s) => [iso(s.x, s.y, s.h + 0.85), iso(s.x + s.w, s.y + s.d, 0)])];
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 18;
    return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
  }, []);

  const order = [...STATIONS].sort((a, b) => a.x + a.y - (b.x + b.y));
  const sel = STATIONS.find((s) => s.key === selected)!;
  const info = sel.agent ? { title: sel.agent.name, body: sel.agent.role, foot: sel.agent.handsOver } : INFO[sel.key]!;

  const onKey = (e: React.KeyboardEvent, key: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(key);
    }
  };

  return (
    <figure className="s-line" data-agent-line>
      <div className="s-line__stage">
        <ol className="s-line__steps" aria-label="Review line zones">
          {ZONE_STEPS.map((step, i) => (
            <li key={step.n} className={step.hero ? "s-line__step s-line__step--hero" : "s-line__step"}>
              {i > 0 ? <span className="s-line__step-arrow" aria-hidden>
                →
              </span> : null}
              <span className="s-line__step-n">{step.n}</span>
              <span className="s-line__step-label">{step.label}</span>
            </li>
          ))}
        </ol>
        <svg
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          role="group"
          aria-label="The review line: patient data passes intake and specialist agents, then stops at the clinician checkpoint; only accepted work moves on to coordination and staging, with the audit ledger recording every step. Agents are in validation unless marked planned."
        >
          <defs>
            <filter id="s-line-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#121715" floodOpacity="0.16" />
            </filter>
            <filter id="s-line-gate-glow" x="-30%" y="-30%" width="160%" height="180%">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#9aa82e" floodOpacity="0.35" />
            </filter>
          </defs>

          <polygon points={pts(FLOOR)} className="s-line__floor" />

          {/* Zone pads + chip captions — numbered groups a reader can spot without squinting */}
          <g className="s-line__zones" aria-hidden>
            {ZONES.map((z) => {
              const [x0, y0, x1, y1] = z.corners;
              const pad = [iso(x0, y0), iso(x1, y0), iso(x1, y1), iso(x0, y1)];
              const [lx, ly] = iso((x0 + x1) / 2, y0 + 0.12, 0);
              const chipH = 22;
              const chipX = lx - z.chipW / 2;
              const chipY = ly - 10;
              const title = z.n ? `${z.n} · ${z.label}` : z.label;
              return (
                <g key={z.key}>
                  <polygon points={pts(pad)} className={`s-line__zone s-line__zone--${z.key}`} />
                  <rect
                    x={chipX}
                    y={chipY}
                    width={z.chipW}
                    height={chipH}
                    rx={11}
                    ry={11}
                    className={`s-line__zone-chip s-line__zone-chip--${z.key}`}
                  />
                  <text x={lx} y={chipY + 15} textAnchor="middle" className="s-line__zone-label" fill={z.ink}>
                    {title}
                  </text>
                </g>
              );
            })}
          </g>

          {PRE.map((d, i) => (
            <path key={`b${i}`} d={d} className="s-line__belt" />
          ))}
          {POST_ACCEPT.map((d, i) => (
            <path key={`p${i}`} d={d} className={`s-line__belt s-line__belt--post${decision === "accepted" ? " is-open" : ""}`} />
          ))}
          <path d={path("SHIELD", "gate")} className="s-line__wire" />
          <path d={path("CONDUCTOR", "GUARDIAN")} className="s-line__wire" />
          <path d={path("COMPASS", "BRIDGE")} className="s-line__wire" />

          {order.map((s) => {
            const f = FACE[s.kind];
            const top = [iso(s.x, s.y, s.h), iso(s.x + s.w, s.y, s.h), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x, s.y + s.d, s.h)];
            const right = [iso(s.x + s.w, s.y, 0), iso(s.x + s.w, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x + s.w, s.y, s.h)];
            const front = [iso(s.x, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x, s.y + s.d, s.h)];
            const active = selected === s.key;
            const name = s.agent ? `${s.agent.name}: ${s.agent.statusLabel}` : INFO[s.key]!.title;
            const mark = statusMarkerClass(s.agent);
            const [mx, my] = iso(s.x + s.w * 0.78, s.y + s.d * 0.22, s.h + 0.08);
            return (
              <g
                key={s.key}
                className={`s-line__st s-line__st--${s.kind}${active ? " is-active" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={name}
                data-station={s.key}
                onMouseEnter={() => setSelected(s.key)}
                onFocus={() => setSelected(s.key)}
                onClick={() => setSelected(s.key)}
                onKeyDown={(e) => onKey(e, s.key)}
              >
                <g filter={s.kind === "planned" ? undefined : s.kind === "gate" ? "url(#s-line-gate-glow)" : "url(#s-line-shadow)"}>
                  <polygon points={pts(front)} fill={f.left} />
                  <polygon points={pts(right)} fill={f.right} />
                  <polygon points={pts(top)} fill={f.top} />
                </g>
                {active ? <polygon points={pts(top)} className="s-line__ring" /> : null}
                {mark ? <circle cx={mx} cy={my} r={s.kind === "planned" ? 4.5 : 5} className={mark} aria-hidden /> : null}
                {s.kind === "gate" ? (
                  <g className="s-line__barrier" data-state={decision} aria-hidden>
                    {(() => {
                      const ax = s.x - 0.35;
                      const p1 = iso(ax, s.y + 0.15, 0);
                      const p2 = iso(ax, s.y + s.d - 0.15, 0);
                      const t1 = iso(ax, s.y + 0.15, 0.5);
                      const arm = decision === "accepted" ? iso(ax, s.y + 0.15, 1.35) : iso(ax, s.y + s.d - 0.15, 0.5);
                      return (
                        <>
                          <line className="s-line__post" x1={p1[0]} y1={p1[1]} x2={t1[0]} y2={t1[1]} />
                          <line className="s-line__post" x1={p2[0]} y1={p2[1]} x2={iso(ax, s.y + s.d - 0.15, 0.5)[0]} y2={iso(ax, s.y + s.d - 0.15, 0.5)[1]} />
                          <line className="s-line__arm" x1={t1[0]} y1={t1[1]} x2={arm[0]} y2={arm[1]} />
                        </>
                      );
                    })()}
                  </g>
                ) : null}
              </g>
            );
          })}

          <g aria-hidden className="s-line__labels">
            {STATIONS.map((s) => {
              const [lx, ly] = iso(s.x + s.w / 2, s.y + s.d / 2, s.h);
              const [nx, ny] = s.labelNudge ?? [0, 0];
              const anchor = nx < -8 ? "end" : nx > 8 ? "start" : "middle";
              return (
                <text
                  key={`l${s.key}`}
                  x={lx + nx}
                  y={ly - 14 + ny}
                  textAnchor={anchor}
                  className={`s-line__label s-line__label--${s.kind}${selected === s.key ? " is-active" : ""}`}
                >
                  {s.label}
                </text>
              );
            })}
          </g>

          {/* Trays = drafts travelling the line (legend explains; not status markers) */}
          {motion
            ? PRE.map((d, i) => (
                <circle key={`t${i}`} r="4.5" className="s-line__tray">
                  <animateMotion dur="5.6s" begin={`${i * 1.35}s`} repeatCount="indefinite" path={d} keyPoints="0;1;1" keyTimes="0;0.82;1" calcMode="linear" />
                </circle>
              ))
            : null}
          {motion && decision === "accepted"
            ? POST_ACCEPT.map((d, i) => (
                <circle key={`a${i}`} r="4.5" className="s-line__tray s-line__tray--accepted">
                  <animateMotion dur="2.5s" begin={`${i * 0.55}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))
            : null}
        </svg>

        <div className="s-line__legend-panel">
          <p className="s-line__legend-title">Diagram key</p>
          <ul className="s-line__legend" aria-label="Diagram key">
            <li>
              <i className="s-line__swatch s-line__swatch--gate" aria-hidden />
              Lime block — clinician checkpoint (every draft stops here)
            </li>
            <li>
              <i className="s-line__swatch s-line__swatch--validation" aria-hidden />
              Amber marker — in validation (synthetic patients only)
            </li>
            <li>
              <i className="s-line__swatch s-line__swatch--planned" aria-hidden />
              Dashed block — planned, not built
            </li>
            <li>
              <i className="s-line__swatch s-line__swatch--tray" aria-hidden />
              Moving puck — a draft travelling the line
            </li>
          </ul>
        </div>
      </div>

      <figcaption className="s-line__readout" aria-live="polite">
        <div className="s-line__readout-head">
          <h3>{info.title}</h3>
          {sel.agent ? (
            <span className={`s-status s-status--${sel.agent.status === "planned" ? "planned" : sel.agent.status === "production" ? "production" : "partial"}`}>
              {sel.agent.statusLabel}
            </span>
          ) : sel.kind === "gate" ? (
            <span className="s-status s-status--synthetic">Clinician checkpoint</span>
          ) : null}
        </div>
        <p>{info.body}</p>
        <p className="s-line__foot">{info.foot}</p>
        <div className="s-line__controls" role="group" aria-label="What the clinician decides">
          <span>At the checkpoint, the clinician</span>
          <button
            type="button"
            className={decision === "accepted" ? "is-on" : ""}
            onClick={() => {
              setDecision("accepted");
              setSelected("gate");
            }}
          >
            accepts
          </button>
          <button
            type="button"
            className={decision === "rejected" ? "is-on" : ""}
            onClick={() => {
              setDecision("rejected");
              setSelected("gate");
            }}
          >
            rejects
          </button>
        </div>
        <p className="s-line__outcome" data-decision={decision}>
          {decision === "accepted"
            ? "Accepted work moves on: Pathway prepares any referral for confirmation, and Bridge stages the record. Shield records the decision."
            : decision === "rejected"
              ? "Rejected drafts stop here with the clinician's reason. Nothing moves on; the reason is kept for learning."
              : "Drafts wait at the checkpoint. Choose a decision to see what moves on."}
        </p>
        <p className="s-line__hint">Hover, tap or tab through the stations. Flow reads left to right.</p>
      </figcaption>
    </figure>
  );
}
