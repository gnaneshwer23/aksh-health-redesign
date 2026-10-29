"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AgpChart, Big, Chip, RangeStack, Ring, Stats, Tile, Timeline, Worklist } from "@/components/site/canvas/tiles";
import { workflowDemo } from "@/lib/workflow-demos";

import { WorkflowDemoPlayer } from "./WorkflowDemoPlayer";

function Frame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <figure className="c-canvas wd-frame" data-canvas="glucose" aria-label={`${title} (illustrative, synthetic data)`}>
      <div className="c-main" style={{ width: "100%" }}>
        <header className="c-head">
          <div>
            <span className="c-head__hello">Riverside Diabetes Centre · Thursday</span>
            <h3 className="c-head__title">{title}</h3>
          </div>
          <div className="c-head__right">
            <Chip tone="ink">Synthetic data</Chip>
            <Chip tone="teal">Trusted CGM</Chip>
          </div>
        </header>
        <div className="wd-frame__body">{children}</div>
        <figcaption className="c-caption">
          Illustrative example · synthetic patients · the clinician decides which targets apply; no autonomous treatment changes
        </figcaption>
      </div>
    </figure>
  );
}

function Scene({ step, decision, setStep }: { step: string; decision: string; setStep: (s: string) => void }) {
  if (step === "readings") {
    return (
      <Frame title="Glucose data arrives">
        <Tile title="Sources today" aside={<Chip>Last 14 days</Chip>}>
          <Timeline
            steps={[
              { t: "CGM upload · A. Mensah", d: "Device feed · 94% sensor wear", state: "now" },
              { t: "Patient app reading · S. Novak", d: "Patient-reported until a clinician checks it", state: "done" },
              { t: "Thin file · P. Silva", d: "9 days of data · completeness warning", state: "next" },
            ]}
          />
        </Tile>
      </Frame>
    );
  }

  if (step === "worklist") {
    return (
      <Frame title="Prioritised worklist">
        <Tile title="Worklist · low glucose first" aside={<Chip tone="red">2 need attention</Chip>}>
          <Worklist
            rows={[
              { dot: "red", name: "A. Mensah", detail: "TBR 8% · 2% below 3.0 mmol/L", chip: <Chip tone="red">Urgent</Chip> },
              { dot: "amber", name: "S. Novak", detail: "Time in range 61% · patient upload unverified", chip: <Chip tone="amber">Review</Chip> },
              { dot: "grey", name: "P. Silva", detail: "9 days of data · not enough yet", chip: <Chip>Data</Chip> },
              { dot: "teal", name: "L. Rossi", detail: "Time in range 78%", chip: <Chip tone="teal">On target</Chip> },
            ]}
          />
        </Tile>
      </Frame>
    );
  }

  if (step === "explain") {
    return (
      <Frame title="Explanation · A. Mensah">
        <div className="wd-split">
          <Tile title="A. Mensah · 14 days" aside={<Chip tone="teal">94% sensor wear</Chip>} className="c-tile--hero">
            <AgpChart height={200} />
            <div className="c-legend">
              <span><i className="c-key c-key--target" />Target 3.9–10</span>
              <span><i className="c-key c-key--median" />Median</span>
              <span><i className="c-key c-key--low" />Night-time low</span>
            </div>
            <Stats
              items={[
                { value: "9.8 mmol/L", label: "Mean glucose" },
                { value: "7.9%", label: "GMI" },
                { value: "41%", label: "Variability (CV)" },
                { value: "14 days", label: "Data · 94% wear" },
              ]}
            />
          </Tile>
          <Tile title="Time in range">
            <div className="c-ringrow">
              <Ring pct={48} label="Time in range" tone="lime" />
              <Big value="8" unit="%" label="below range" />
            </div>
            <RangeStack
              parts={[
                { label: "Very high", pct: 12, tone: "vhigh" },
                { label: "High", pct: 32, tone: "high" },
                { label: "In range", pct: 48, tone: "in" },
                { label: "Low", pct: 6, tone: "low" },
                { label: "Very low", pct: 2, tone: "vlow" },
              ]}
            />
          </Tile>
        </div>
      </Frame>
    );
  }

  if (step === "review") {
    return (
      <Frame title="Clinician review">
        <Tile title="A. Mensah · decide the response" aside={<Chip tone="amber">Clinician in control</Chip>}>
          <p className="c-text">
            Aksh prepared time in range, lows, and variability against consensus targets. It does not change treatment
            or message the patient. Choose what happens next.
          </p>
          <div className="c-actions" role="group" aria-label="Clinician actions">
            <button type="button" className="is-primary" onClick={() => setStep("result")}>
              Mark reviewed
            </button>
            <button type="button" onClick={() => setStep("result")}>
              Book follow-up
            </button>
            <button type="button" onClick={() => setStep("result")}>
              Escalate
            </button>
          </div>
          <p className="c-text" style={{ marginTop: 12 }}>
            Selected scenario:{" "}
            <b>
              {decision === "reviewed"
                ? "Mark reviewed · no change today"
                : decision === "followup"
                  ? "Book follow-up"
                  : "Escalate to named clinician"}
            </b>
            .
          </p>
        </Tile>
      </Frame>
    );
  }

  const resultTitle =
    decision === "followup"
      ? "Recorded · follow-up booked"
      : decision === "escalate"
        ? "Recorded · escalated"
        : "Recorded · reviewed";

  return (
    <Frame title={resultTitle}>
      <Tile title="Audit trail" aside={<Chip>Immutable</Chip>}>
        <Timeline
          steps={[
            { t: "CGM measures calculated", d: "TIR 48% · TBR 8% · CV 41%", state: "done" },
            { t: "Worklist ranked low glucose first", d: "A. Mensah at top", state: "done" },
            {
              t:
                decision === "followup"
                  ? "Clinician booked follow-up"
                  : decision === "escalate"
                    ? "Escalated to named clinician"
                    : "Clinician marked reviewed",
              d: "Decision under signed-in account · no treatment changed by Aksh",
              state: "now",
            },
            { t: "Weekly results will include this review", d: "Against your clinic baseline", state: "next" },
          ]}
        />
      </Tile>
    </Frame>
  );
}

function GlucoseMonitorDemoInner() {
  const params = useSearchParams();
  const capture = params.get("capture") === "preview";
  const variant = params.get("variant") ?? undefined;
  const entry = workflowDemo("glucose");

  return (
    <WorkflowDemoPlayer entry={entry} initialVariantId={variant} capture={capture}>
      {(state) => <Scene step={state.step} decision={state.decision} setStep={state.setStep} />}
    </WorkflowDemoPlayer>
  );
}

export function GlucoseMonitorDemo() {
  return (
    <Suspense fallback={<div className="s-container" style={{ padding: 48 }}>Loading demo…</div>}>
      <GlucoseMonitorDemoInner />
    </Suspense>
  );
}
