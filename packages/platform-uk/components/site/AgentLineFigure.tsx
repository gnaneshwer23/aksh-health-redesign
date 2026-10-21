"use client";

/**
 * "The review line": the agent loop drawn as an isometric production line. Patient data enters a dock, passes intake,
 * then four analysis benches working in parallel, and stops at a raised clinician checkpoint. Only what the clinician
 * accepts moves on to the coordination desk and a sealed staging dock; the audit ledger stands beside the line and the
 * orchestrator's tower oversees it. Every station is focusable; the readout explains it. Motion stops under
 * prefers-reduced-motion. Content comes from components/site/agents-content.ts (statuses from the agent register).
 */
import { useEffect, useMemo, useState } from "react";

import { PUBLIC_AGENTS, type PublicAgent } from "@/components/site/agents-content";

const S = 46;
const COS = 0.866;
type Pt = [number, number];
const iso = (x: number, y: number, z = 0): Pt => [(x - y) * S * COS, (x + y) * S * 0.5 - z * S];
const pts = (p: Pt[]) => p.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

type Kind = "dock" | "intake" | "bench" | "gate" | "out" | "tower" | "ledger" | "aggregate" | "planned";
type Station = { key: string; x: number; y: number; w: number; d: number; h: number; kind: Kind; label: string; agent?: PublicAgent };

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

const STATIONS: Station[] = [
  { key: "dock", x: 0, y: -0.5, w: 1.1, d: 1.1, h: 0.3, kind: "dock", label: "Patient data" },
  { key: "VOICE", x: 1.9, y: -1.05, w: 0.9, d: 0.9, h: 0.5, kind: "intake", label: "Voice", agent: byId("VOICE") },
  { key: "CANVAS", x: 1.9, y: 0.35, w: 0.9, d: 0.9, h: 0.5, kind: "intake", label: "Canvas", agent: byId("CANVAS") },
  { key: "SYNTHESIS", x: 3.9, y: -1.75, w: 0.9, d: 0.75, h: 0.55, kind: "bench", label: "Synthesis", agent: byId("SYNTHESIS") },
  { key: "GUARDIAN", x: 3.9, y: -0.7, w: 0.9, d: 0.75, h: 0.55, kind: "bench", label: "Guardian", agent: byId("GUARDIAN") },
  { key: "HORIZON", x: 3.9, y: 0.35, w: 0.9, d: 0.75, h: 0.55, kind: "bench", label: "Horizon", agent: byId("HORIZON") },
  { key: "NEXUS", x: 3.9, y: 1.4, w: 0.9, d: 0.75, h: 0.55, kind: "bench", label: "Nexus", agent: byId("NEXUS") },
  { key: "DrASSIST", x: 5.5, y: -2.05, w: 0.8, d: 0.75, h: 0.45, kind: "bench", label: "DrAssist", agent: byId("DrASSIST") },
  { key: "gate", x: 7.0, y: -0.45, w: 1.3, d: 1.3, h: 1.2, kind: "gate", label: "Clinician" },
  { key: "PATHWAY", x: 9.4, y: -1.3, w: 0.95, d: 0.95, h: 0.5, kind: "out", label: "Pathway", agent: byId("PATHWAY") },
  { key: "BRIDGE", x: 9.4, y: 0.45, w: 0.95, d: 0.95, h: 0.5, kind: "out", label: "Bridge", agent: byId("BRIDGE") },
  { key: "SHIELD", x: 7.3, y: -3.4, w: 0.85, d: 0.85, h: 1.9, kind: "ledger", label: "Shield (audit)", agent: byId("SHIELD") },
  { key: "CONDUCTOR", x: 3.95, y: -3.9, w: 0.85, d: 0.85, h: 2.2, kind: "tower", label: "Orchestrator", agent: byId("CONDUCTOR") },
  { key: "COMPASS", x: 11.2, y: -2.6, w: 0.95, d: 0.95, h: 0.8, kind: "aggregate", label: "Compass", agent: byId("COMPASS") },
  { key: "PRISM", x: 12.4, y: -0.6, w: 0.8, d: 0.8, h: 0.5, kind: "planned", label: "Prism (planned)", agent: byId("PRISM") },
  { key: "ATLAS", x: 12.4, y: 0.8, w: 0.8, d: 0.8, h: 0.5, kind: "planned", label: "Trials (planned)", agent: byId("ATLAS") },
];

const FLOOR: Pt[] = [iso(-0.5, -4.6), iso(13.6, -4.6), iso(13.6, 2.6), iso(-0.5, 2.6)];

const centre = (k: string, z = 0.02): Pt => {
  const s = STATIONS.find((x) => x.key === k)!;
  return iso(s.x + s.w / 2, s.y + s.d / 2, z);
};
const path = (...keys: string[]) => "M" + keys.map((k) => centre(k).map((n) => n.toFixed(1)).join(",")).join(" L");

const PRE = ["SYNTHESIS", "GUARDIAN", "HORIZON", "NEXUS"].map((b, i) => path("dock", i < 2 ? "VOICE" : "CANVAS", b, "gate"));
const POST_ACCEPT = [path("gate", "PATHWAY"), path("gate", "BRIDGE")];

const INFO: Record<string, { title: string; body: string; foot: string }> = {
  dock: { title: "Patient data in", body: "Schedules, CGM, laboratory results with their LOINC codes, medicines and readings patients choose to share. Every value keeps its source.", foot: "Read only: Aksh writes nothing back to your records system." },
  gate: { title: "The clinician checkpoint", body: "Every draft stops here. A named clinician accepts, edits or rejects it, and decides urgent concerns, referrals and medication decisions at their own gates. Nothing passes without that decision.", foot: "Decided on the server under the signed-in account, with an audit record saved in the same step." },
};

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
    // The floor sets the frame, so nothing is cropped at the edges.
    const all = [...FLOOR, ...STATIONS.flatMap((s) => [iso(s.x, s.y, s.h + 0.7), iso(s.x + s.w, s.y + s.d, 0)])];
    const xs = all.map((p) => p[0]);
    const ys = all.map((p) => p[1]);
    const pad = 14;
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
        <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} role="group" aria-label="The review line: patient data passes intake and four analysis agents, then stops at the clinician checkpoint; only accepted work moves on to coordination and staging, with the audit ledger recording every step.">
          <defs>
            <filter id="s-line-shadow" x="-20%" y="-20%" width="140%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#121715" floodOpacity="0.16" />
            </filter>
          </defs>
          {/* floor */}
          <polygon points={pts(FLOOR)} className="s-line__floor" />
          {/* belts */}
          {PRE.map((d, i) => <path key={`b${i}`} d={d} className="s-line__belt" />)}
          {POST_ACCEPT.map((d, i) => <path key={`p${i}`} d={d} className={`s-line__belt s-line__belt--post${decision === "accepted" ? " is-open" : ""}`} />)}
          <path d={path("SHIELD", "gate")} className="s-line__wire" />
          <path d={path("CONDUCTOR", "SYNTHESIS")} className="s-line__wire" />
          <path d={path("COMPASS", "BRIDGE")} className="s-line__wire" />
          {/* stations, back to front */}
          {order.map((s) => {
            const f = FACE[s.kind];
            const top = [iso(s.x, s.y, s.h), iso(s.x + s.w, s.y, s.h), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x, s.y + s.d, s.h)];
            const right = [iso(s.x + s.w, s.y, 0), iso(s.x + s.w, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x + s.w, s.y, s.h)];
            const front = [iso(s.x, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, 0), iso(s.x + s.w, s.y + s.d, s.h), iso(s.x, s.y + s.d, s.h)];
            const active = selected === s.key;
            const name = s.agent ? `${s.agent.name}: ${s.agent.statusLabel}` : INFO[s.key]!.title;
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
                <g filter={s.kind === "planned" ? undefined : "url(#s-line-shadow)"}>
                  <polygon points={pts(front)} fill={f.left} />
                  <polygon points={pts(right)} fill={f.right} />
                  <polygon points={pts(top)} fill={f.top} />
                </g>
                {active ? <polygon points={pts(top)} className="s-line__ring" /> : null}
                {s.kind === "gate" ? (
                  <g className="s-line__barrier" data-state={decision} aria-hidden>
                    {(() => {
                      const ax = s.x - 0.35;
                      const p1 = iso(ax, s.y + 0.1, 0);
                      const p2 = iso(ax, s.y + s.d - 0.1, 0);
                      const t1 = iso(ax, s.y + 0.1, 0.45);
                      const arm = decision === "accepted" ? iso(ax, s.y + 0.1, 1.2) : iso(ax, s.y + s.d - 0.1, 0.45);
                      return (
                        <>
                          <line className="s-line__post" x1={p1[0]} y1={p1[1]} x2={t1[0]} y2={t1[1]} />
                          <line className="s-line__post" x1={p2[0]} y1={p2[1]} x2={iso(ax, s.y + s.d - 0.1, 0.45)[0]} y2={iso(ax, s.y + s.d - 0.1, 0.45)[1]} />
                          <line className="s-line__arm" x1={t1[0]} y1={t1[1]} x2={arm[0]} y2={arm[1]} />
                        </>
                      );
                    })()}
                  </g>
                ) : null}
              </g>
            );
          })}
          {/* labels on top, so no station hides another's name */}
          <g aria-hidden className="s-line__labels">
            {STATIONS.map((s) => {
              const [lx, ly] = iso(s.x + s.w / 2, s.y + s.d / 2, s.h);
              return <text key={`l${s.key}`} x={lx} y={ly - 12} textAnchor="middle" className={`s-line__label${selected === s.key ? " is-active" : ""}`}>{s.label}</text>;
            })}
          </g>
          {/* trays moving down the line */}
          {motion
            ? PRE.map((d, i) => (
                <circle key={`t${i}`} r="5" className="s-line__tray">
                  <animateMotion dur="5.2s" begin={`${i * 1.3}s`} repeatCount="indefinite" path={d} keyPoints="0;1;1" keyTimes="0;0.8;1" calcMode="linear" />
                </circle>
              ))
            : null}
          {motion && decision === "accepted"
            ? POST_ACCEPT.map((d, i) => (
                <circle key={`a${i}`} r="5" className="s-line__tray s-line__tray--accepted">
                  <animateMotion dur="2.4s" begin={`${i * 0.6}s`} repeatCount="indefinite" path={d} />
                </circle>
              ))
            : null}
        </svg>
      </div>
      <figcaption className="s-line__readout" aria-live="polite">
        <div className="s-line__readout-head">
          <h3>{info.title}</h3>
          {sel.agent ? <span className={`s-status s-status--${sel.agent.status === "planned" ? "planned" : sel.agent.status === "production" ? "production" : "partial"}`}>{sel.agent.statusLabel}</span> : null}
        </div>
        <p>{info.body}</p>
        <p className="s-line__foot">{info.foot}</p>
        <div className="s-line__controls" role="group" aria-label="What the clinician decides">
          <span>At the checkpoint, the clinician</span>
          <button type="button" className={decision === "accepted" ? "is-on" : ""} onClick={() => { setDecision("accepted"); setSelected("gate"); }}>accepts</button>
          <button type="button" className={decision === "rejected" ? "is-on" : ""} onClick={() => { setDecision("rejected"); setSelected("gate"); }}>rejects</button>
        </div>
        <p className="s-line__outcome" data-decision={decision}>
          {decision === "accepted"
            ? "Accepted work moves on: Pathway prepares any referral for confirmation, and Bridge stages the record. Shield records the decision."
            : decision === "rejected"
              ? "Rejected drafts stop here with the clinician's reason. Nothing moves on; the reason is kept for learning."
              : "Drafts wait at the checkpoint. Choose a decision to see what moves on."}
        </p>
        <p className="s-line__hint">Hover, tap or tab through the stations.</p>
      </figcaption>
    </figure>
  );
}
