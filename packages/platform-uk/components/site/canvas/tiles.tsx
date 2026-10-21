/**
 * The product canvas tile system. Every product visual on the public site is built from these pieces so the pages read
 * as one product: one frame, one rail, one tile radius, one type scale, one accent (lime) over teal data ink.
 * All figures are illustrative and synthetic; the frame says so.
 */
import type { ReactNode } from "react";

export function Tile({ title, aside, children, className = "", span }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string; span?: string }) {
  return (
    <section className={`c-tile ${className}`} style={span ? { gridArea: span } : undefined}>
      {title || aside ? (
        <header className="c-tile__head">
          {title ? <h4>{title}</h4> : <span />}
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "lime" | "teal" | "amber" | "red" | "ink" | "ai" }) {
  return <span className={`c-chip c-chip--${tone}`}>{children}</span>;
}

export function Big({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div className="c-big">
      <b>
        {value}
        {unit ? <small>{unit}</small> : null}
      </b>
      <span>{label}</span>
    </div>
  );
}

/** A ring (percentage) with the value in the middle. */
export function Ring({ pct, label, size = 112, tone = "teal" }: { pct: number; label: string; size?: number; tone?: "teal" | "lime" }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg className={`c-ring c-ring--${tone}`} viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label}: ${pct}%`}>
      <circle cx="50" cy="50" r={r} className="c-ring__track" />
      <circle cx="50" cy="50" r={r} className="c-ring__value" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="c-ring__text">{pct}%</text>
    </svg>
  );
}

/** Vertical bars; `highlight` marks one bar in lime. */
export function Bars({ values, labels, highlight, max, height = 96, unit = "" }: { values: number[]; labels: string[]; highlight?: number; max?: number; height?: number; unit?: string }) {
  const top = max ?? Math.max(...values) * 1.15;
  return (
    <div className="c-bars" style={{ height }} role="img" aria-label={values.map((v, i) => `${labels[i]} ${v}${unit}`).join(", ")}>
      {values.map((v, i) => (
        <div key={i} className="c-bars__col">
          <div className={`c-bars__bar${i === highlight ? " is-hi" : ""}`} style={{ height: `${(v / top) * 100}%` }}>
            {i === highlight ? <em>{v}{unit}</em> : null}
          </div>
          <span>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

/** Ambulatory glucose profile over 24 hours: 5–95 and 25–75 percentile bands, median, target range 3.9–10 mmol/L. */
export function AgpChart({ height = 236 }: { height?: number }) {
  const W = 420;
  const H = 200;
  const y = (mmol: number) => H - 14 - ((mmol - 2) / 16) * (H - 28);
  const x = (h: number) => 28 + (h / 24) * (W - 40);
  const hours = Array.from({ length: 49 }, (_, i) => i / 2);
  const median = (h: number) => 7.2 + 2.6 * Math.exp(-((h - 8.5) ** 2) / 4) + 2.1 * Math.exp(-((h - 13.5) ** 2) / 3.5) + 2.4 * Math.exp(-((h - 19.5) ** 2) / 4) - 1.0 * Math.exp(-((h - 3.5) ** 2) / 3);
  const band = (spread: number) => {
    const upper = hours.map((h) => `${x(h).toFixed(1)},${y(median(h) + spread * (1 + 0.25 * Math.sin(h / 3))).toFixed(1)}`);
    const lower = hours.slice().reverse().map((h) => `${x(h).toFixed(1)},${y(Math.max(2.4, median(h) - spread * (0.8 + 0.2 * Math.cos(h / 4)))).toFixed(1)}`);
    return `M${upper.join(" L")} L${lower.join(" L")} Z`;
  };
  const line = `M${hours.map((h) => `${x(h).toFixed(1)},${y(median(h)).toFixed(1)}`).join(" L")}`;
  return (
    <svg className="c-agp" viewBox={`0 0 ${W} ${H}`} style={{ height }} role="img" aria-label="Ambulatory glucose profile over 24 hours: median and percentile bands against the 3.9 to 10 mmol/L target range">
      <rect x={x(0)} y={y(10)} width={x(24) - x(0)} height={y(3.9) - y(10)} className="c-agp__target" />
      {[3.9, 10].map((v) => (
        <g key={v}>
          <line x1={x(0)} x2={x(24)} y1={y(v)} y2={y(v)} className="c-agp__rule" />
          <text x={4} y={y(v) + 3} className="c-agp__axis">{v}</text>
        </g>
      ))}
      <path d={band(4.2)} className="c-agp__outer" />
      <path d={band(2.0)} className="c-agp__inner" />
      <path d={line} className="c-agp__median" />
      {[0, 6, 12, 18, 24].map((h) => (
        <text key={h} x={x(h)} y={H - 1} textAnchor="middle" className="c-agp__axis">{String(h).padStart(2, "0")}:00</text>
      ))}
      <circle cx={x(3.5)} cy={y(median(3.5) - 3.2)} r="4.5" className="c-agp__low" />
    </svg>
  );
}

export type Row = { dot: "red" | "amber" | "teal" | "lime" | "grey"; name: string; detail: string; chip?: ReactNode };
export function Worklist({ rows }: { rows: Row[] }) {
  return (
    <ul className="c-list">
      {rows.map((r) => (
        <li key={r.name}>
          <i className={`c-dot c-dot--${r.dot}`} aria-hidden />
          <span>
            <b>{r.name}</b>
            <small>{r.detail}</small>
          </span>
          {r.chip}
        </li>
      ))}
    </ul>
  );
}

/** One AI draft awaiting a clinician, with the three decisions. */
export function Draft({ agent, title, body, status = "Needs review" }: { agent: string; title: string; body: string; status?: string }) {
  return (
    <div className="c-draft">
      <div className="c-draft__top">
        <Chip tone="ai">{agent} · AI draft</Chip>
        <Chip tone="amber">{status}</Chip>
      </div>
      <b>{title}</b>
      <p>{body}</p>
      <div className="c-draft__actions" aria-hidden>
        <span>Reject</span>
        <span>Edit</span>
        <span className="is-primary">Accept</span>
      </div>
    </div>
  );
}

export function Timeline({ steps }: { steps: { t: string; d: string; state: "done" | "now" | "next" }[] }) {
  return (
    <ol className="c-steps">
      {steps.map((s) => (
        <li key={s.t} data-state={s.state}>
          <i aria-hidden />
          <span>
            <b>{s.t}</b>
            <small>{s.d}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** The five consensus glucose ranges as one stacked bar, with values. */
export function RangeStack({ parts }: { parts: { label: string; pct: number; tone: "vhigh" | "high" | "in" | "low" | "vlow" }[] }) {
  return (
    <div className="c-range">
      <div className="c-range__bar" role="img" aria-label={parts.map((p) => `${p.label} ${p.pct}%`).join(", ")}>
        {parts.map((p) => <span key={p.label} className={`c-range--${p.tone}`} style={{ flexBasis: `${Math.max(p.pct, 1.5)}%` }} />)}
      </div>
      <ul>
        {parts.map((p) => (
          <li key={p.label}><i className={`c-range--${p.tone}`} aria-hidden /><span>{p.label}</span><b>{p.pct}%</b></li>
        ))}
      </ul>
    </div>
  );
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="c-stats">
      {items.map((i) => (
        <div key={i.label}><dt>{i.label}</dt><dd>{i.value}</dd></div>
      ))}
    </dl>
  );
}

/** A small group of tiles in the canvas frame colour: used inside page sections so they share the workspace look. */
export function Cluster({ children, cols = 2, caption = "Illustrative example · synthetic patients" }: { children: ReactNode; cols?: 1 | 2 | 3; caption?: string }) {
  return (
    <figure className="c-cluster" style={{ ["--c-cols" as string]: cols }}>
      <div className="c-cluster__grid">{children}</div>
      <figcaption className="c-caption">{caption}</figcaption>
    </figure>
  );
}
