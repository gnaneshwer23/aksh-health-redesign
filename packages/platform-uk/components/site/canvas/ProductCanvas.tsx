/**
 * One product canvas for the whole public site. Every page shows the same Aksh workspace (same frame, rail, header and
 * tiles) focused on a different module, so the site reads as one product rather than separate mock-ups. Illustrative,
 * synthetic data only; the frame states it.
 */
import { Activity, CalendarClock, ClipboardCheck, FlaskConical, LayoutGrid, ShieldCheck, Workflow } from "lucide-react";
import type { ReactNode } from "react";

import { AgentLineFigure } from "@/components/site/AgentLineFigure";

import { AgpChart, Bars, Big, Chip, Draft, RangeStack, Ring, Stats, Tile, Timeline, Worklist } from "./tiles";

export type CanvasModule = "today" | "slots" | "glucose" | "agents" | "record" | "audit";

const RAIL: { key: CanvasModule; label: string; Icon: typeof LayoutGrid }[] = [
  { key: "today", label: "Today", Icon: LayoutGrid },
  { key: "slots", label: "Fill slots", Icon: CalendarClock },
  { key: "glucose", label: "Glucose", Icon: Activity },
  { key: "record", label: "Patient record", Icon: FlaskConical },
  { key: "agents", label: "Review line", Icon: Workflow },
  { key: "audit", label: "Audit", Icon: ShieldCheck },
];

const TITLE: Record<CanvasModule, string> = {
  today: "Today",
  slots: "Fill cancelled slots",
  glucose: "Glucose monitoring",
  agents: "Clinical review",
  record: "Patient record",
  audit: "Audit and access",
};

function Frame({ module, children, note }: { module: CanvasModule; children: ReactNode; note?: string }) {
  return (
    <figure className="c-canvas" data-canvas={module} aria-label={`Aksh workspace, ${TITLE[module]} (illustrative, synthetic data)`}>
      <nav className="c-rail" aria-hidden>
        <span className="c-rail__mark">A</span>
        {RAIL.map(({ key, label, Icon }) => (
          <span key={key} className={`c-rail__item${key === module ? " is-on" : ""}`} title={label}>
            <Icon size={18} strokeWidth={1.8} />
          </span>
        ))}
      </nav>
      <div className="c-main">
        <header className="c-head">
          <div>
            <span className="c-head__hello">Riverside Diabetes Centre · Thursday</span>
            <h3 className="c-head__title">{TITLE[module]}</h3>
          </div>
          <div className="c-head__right">
            <span className="c-seg" aria-hidden>
              <span className={module === "today" ? "is-on" : ""}>Today</span>
              <span className={module === "glucose" || module === "record" ? "is-on" : ""}>Patients</span>
              <span className={module === "audit" ? "is-on" : ""}>Results</span>
            </span>
            <Chip tone="ink">Synthetic data</Chip>
          </div>
        </header>
        <div className={`c-grid c-grid--${module}`}>{children}</div>
        <figcaption className="c-caption">Illustrative example · synthetic patients · {note ?? "the real screens work the same way"}</figcaption>
      </div>
    </figure>
  );
}

export function ProductCanvas({ module }: { module: CanvasModule }) {
  if (module === "today") {
    return (
      <Frame module="today">
        <Tile title="Needs you now" aside={<Chip tone="red">2 urgent</Chip>} span="need">
          <Worklist
            rows={[
              { dot: "red", name: "A. Mensah", detail: "Time below 3.0 mmol/L 2% · last 14 days", chip: <Chip tone="red">Low glucose</Chip> },
              { dot: "amber", name: "Freed slot · 09:40", detail: "Diabetes review · 3 patients fit", chip: <Chip tone="lime">Rank</Chip> },
              { dot: "teal", name: "J. Okafor", detail: "eGFR 52 from the lab feed · check due", chip: <Chip>Lab</Chip> },
              { dot: "grey", name: "Hand-off · reception", detail: "Booking not seen in schedule · due 16:00" },
            ]}
          />
        </Tile>
        <Tile title="Glucose, last 14 days" aside={<Chip tone="teal">Trusted CGM only</Chip>} span="agp" className="c-tile--hero">
          <AgpChart />
          <div className="c-legend"><span><i className="c-key c-key--target" />Target 3.9–10</span><span><i className="c-key c-key--median" />Median</span><span><i className="c-key c-key--band" />Range</span></div>
          <Stats items={[{ value: "8.6 mmol/L", label: "Mean glucose" }, { value: "7.1%", label: "GMI" }, { value: "32%", label: "Variability (CV)" }, { value: "14 days", label: "Data · 94% wear" }]} />
        </Tile>
        <Tile title="Time in range" span="tir">
          <div className="c-ringrow"><Ring pct={71} label="Time in range" /><Big value="1" unit="%" label="below 3.0 mmol/L" /></div>
          <RangeStack parts={[{ label: "Very high", pct: 4, tone: "vhigh" }, { label: "High", pct: 21, tone: "high" }, { label: "In range", pct: 71, tone: "in" }, { label: "Low", pct: 3, tone: "low" }, { label: "Very low", pct: 1, tone: "vlow" }]} />
        </Tile>
        <Tile title="Freed slots filled" aside={<Chip>This week</Chip>} span="fill">
          <Big value="68" unit="%" label="against a 41% baseline" />
          <Bars values={[38, 44, 52, 49, 61, 68]} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} highlight={5} height={130} unit="%" max={80} />
        </Tile>
        <Tile title="Waiting for a clinician" aside={<Chip tone="ai">In validation</Chip>} span="draft">
          <Draft agent="Synthesis" title="Consultation note" body="HbA1c 68 mmol/mol, rising since March. Plan: review treatment, recheck in 3 months." />
        </Tile>
      </Frame>
    );
  }
  if (module === "slots") {
    return (
      <Frame module="slots" note="staff choose and contact; Aksh never contacts patients">
        <Tile title="Diabetes review · Thu 09:40" aside={<Chip tone="amber">Shadow mode</Chip>} span="slot">
          <Worklist
            rows={[
              { dot: "lime", name: "1 · R. Okafor", detail: "Overdue care · waiting since 12 Aug", chip: <Chip tone="lime">Eligible</Chip> },
              { dot: "lime", name: "2 · M. Haddad", detail: "Patient asked · waiting since 3 Sep", chip: <Chip tone="lime">Eligible</Chip> },
              { dot: "grey", name: "J. Lindqvist", detail: "Needs 24 h notice · not offered", chip: <Chip>Reason shown</Chip> },
            ]}
          />
          <div className="c-actions" aria-hidden><span className="is-primary">Draft offer</span><span>Skip with reason</span><span>Hand off</span></div>
        </Tile>
        <Tile title="Slot history" span="hist">
          <Timeline
            steps={[
              { t: "Slot received from your schedule", d: "Thu 09:40 · diabetes review", state: "done" },
              { t: "3 ranked, 1 not eligible", d: "Reasons shown for each", state: "done" },
              { t: "Offer approved by staff", d: "Sent through your own channel", state: "done" },
              { t: "Booking confirmed by the schedule", d: "Only now counted as filled", state: "now" },
            ]}
          />
        </Tile>
        <Tile title="Fill rate" span="rate">
          <Big value="68" unit="%" label="locked baseline 41%" />
          <Bars values={[38, 44, 52, 49, 61, 68]} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} highlight={5} height={120} unit="%" max={80} />
        </Tile>
        <Tile title="Staff time per filled slot" span="time">
          <Big value="6" unit="min" label="median, from staff logs" />
        </Tile>
      </Frame>
    );
  }
  if (module === "glucose") {
    return (
      <Frame module="glucose" note="the clinician decides which targets apply">
        <Tile title="Worklist · low glucose first" span="list">
          <Worklist
            rows={[
              { dot: "red", name: "A. Mensah", detail: "TBR 8% · 2% below 3.0", chip: <Chip tone="red">Urgent</Chip> },
              { dot: "amber", name: "S. Novak", detail: "Time in range 61%", chip: <Chip tone="amber">Review</Chip> },
              { dot: "grey", name: "P. Silva", detail: "9 days of data · not enough yet", chip: <Chip>Data</Chip> },
              { dot: "teal", name: "L. Rossi", detail: "Time in range 78%", chip: <Chip tone="teal">On target</Chip> },
            ]}
          />
        </Tile>
        <Tile title="A. Mensah · 14 days" aside={<Chip tone="teal">94% sensor wear</Chip>} span="agp" className="c-tile--hero">
          <AgpChart />
          <div className="c-legend"><span><i className="c-key c-key--target" />Target 3.9–10</span><span><i className="c-key c-key--median" />Median</span><span><i className="c-key c-key--low" />Night-time low</span></div>
          <Stats items={[{ value: "9.8 mmol/L", label: "Mean glucose" }, { value: "7.9%", label: "GMI" }, { value: "41%", label: "Variability (CV)" }, { value: "14 days", label: "Data · 94% wear" }]} />
        </Tile>
        <Tile title="Time in range" span="tir">
          <div className="c-ringrow"><Ring pct={48} label="Time in range" tone="lime" /><Big value="8" unit="%" label="below range" /></div>
          <RangeStack parts={[{ label: "Very high", pct: 12, tone: "vhigh" }, { label: "High", pct: 32, tone: "high" }, { label: "In range", pct: 48, tone: "in" }, { label: "Low", pct: 6, tone: "low" }, { label: "Very low", pct: 2, tone: "vlow" }]} />
        </Tile>
        <Tile title="Variability" span="cv"><Big value="41" unit="%" label="CV · target 36% or less" /></Tile>
      </Frame>
    );
  }
  if (module === "record") {
    return (
      <Frame module="record" note="every value says where it came from">
        <Tile title="HbA1c" aside={<Chip>mmol/mol</Chip>} span="a1c">
          <Big value="68" unit="mmol/mol" label="8.4% · lab feed · 14 Oct" />
          <Bars values={[58, 61, 60, 64, 66, 68]} labels={["Nov", "Jan", "Mar", "May", "Jul", "Oct"]} highlight={5} height={120} max={80} />
        </Tile>
        <Tile title="Laboratory results" aside={<Chip tone="teal">LOINC coded</Chip>} span="labs">
          <table className="c-table">
            <tbody>
              <tr><td>eGFR</td><td><b>52</b> mL/min/1.73 m²</td><td><Chip>Lab feed</Chip></td></tr>
              <tr><td>Urine ACR</td><td><b>4.1</b> mg/mmol</td><td><Chip tone="amber">Corrected</Chip></td></tr>
              <tr><td>LDL</td><td><b>3.4</b> mmol/L</td><td><Chip>Sent as 130 mg/dL</Chip></td></tr>
              <tr><td>ALT</td><td colSpan={2}><span className="c-missing">Not on record</span></td></tr>
            </tbody>
          </table>
        </Tile>
        <Tile title="Kidney check" aside={<Chip tone="ai">AI draft · in validation</Chip>} span="flag">
          <p className="c-text">eGFR below 60 → kidney watch. Rule <b>kidney.egfr_below_60</b>, KDIGO 2024. For clinician review.</p>
        </Tile>
      </Frame>
    );
  }
  if (module === "audit") {
    return (
      <Frame module="audit" note="the database will not let anyone edit or delete a record">
        <Tile title="Audit ledger" aside={<Chip tone="teal">Hash-chained</Chip>} span="ledger">
          <Worklist
            rows={[
              { dot: "teal", name: "Draft accepted · consultation note", detail: "dr.rao@clinic · 10:42 · version 3 → 4" },
              { dot: "amber", name: "Medication gate confirmed", detail: "pharmacist · 10:38 · note recorded" },
              { dot: "grey", name: "Review run recorded", detail: "Orchestrator · 10:31 · order Guardian first" },
              { dot: "red", name: "Draft rejected · referral", detail: "dr.rao@clinic · 10:29 · reason kept" },
            ]}
          />
        </Tile>
        <Tile title="Who can see what" span="access">
          <table className="c-table">
            <tbody>
              <tr><td>Your clinicians</td><td>Your patients only</td></tr>
              <tr><td>Other organisations</td><td>With recorded consent</td></tr>
              <tr><td>AI models</td><td>No patient data in production</td></tr>
            </tbody>
          </table>
        </Tile>
        <Tile title="Two-step sign-in" span="mfa"><Big value="Required" label="for every reviewer before they can decide" /></Tile>
      </Frame>
    );
  }
  return (
    <Frame module="agents" note="agents in validation; a clinician decides every draft">
      <Tile span="line" className="c-tile--flush">
        <AgentLineFigure />
      </Tile>
    </Frame>
  );
}

/** A compact decision card used beside the canvas where a page discusses review. */
export function DraftCard() {
  return (
    <div className="c-tile">
      <Draft agent="Guardian" title="Interaction: anticoagulant with aspirin" body="Bleeding risk. Prescriber to confirm before any change." status="Held for prescriber" />
    </div>
  );
}
