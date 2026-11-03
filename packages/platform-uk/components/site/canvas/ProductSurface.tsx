/**
 * Focused product “screenshot” frames for marketing sections.
 * Same design language as ProductCanvas, but one surface at a time (no rail),
 * so feature sections read as real workspace shots without competing nav chrome.
 * Illustrative · synthetic data only.
 */
import type { ReactNode } from "react";

import { Big, Chip, Draft, Stats, Tile, Timeline, Worklist } from "./tiles";

export type ProductSurfaceId = "review" | "strategy" | "handoff" | "ops";

const TITLE: Record<ProductSurfaceId, string> = {
  review: "GP review queue",
  strategy: "Treatment strategy draft",
  handoff: "Lab and pharmacy hand-off",
  ops: "Agent Ops · evaluation",
};

const NOTE: Record<ProductSurfaceId, string> = {
  review: "honesty strip states sim vs live-path; a named clinician decides every draft",
  strategy: "personalised draft only · not a prescription · HITL required",
  handoff: "lab/pharmacy queues are human-gated; no autonomous Rx or silent EHR write",
  ops: "evaluation honesty · scaffolds labelled · meeting targets does not release an agent",
};

function SurfaceFrame({
  id,
  children,
}: {
  id: ProductSurfaceId;
  children: ReactNode;
}) {
  return (
    <figure
      className="c-surface"
      data-surface={id}
      aria-label={`Aksh ${TITLE[id]} (illustrative, synthetic data)`}
    >
      <header className="c-surface__bar">
        <span className="c-surface__mark" aria-hidden>
          A
        </span>
        <div>
          <p className="c-surface__hello">Riverside Diabetes Centre · synthetic</p>
          <h3 className="c-surface__title">{TITLE[id]}</h3>
        </div>
        <Chip tone="ink">Synthetic data</Chip>
      </header>
      <div className={`c-surface__grid c-surface__grid--${id}`}>{children}</div>
      <figcaption className="c-caption">
        Illustrative example · synthetic patients · {NOTE[id]}
      </figcaption>
    </figure>
  );
}

function ReviewBody() {
  return (
    <>
      <Tile title="Honesty" aside={<Chip tone="amber">Validation / HITL</Chip>} span="honesty">
        <ul className="c-honesty" aria-label="Review honesty">
          <li>
            <b>Session</b>
            <span>Rules + optional LLM on synthetic only</span>
          </li>
          <li>
            <b>Adapters</b>
            <span>EMIS / EPS sim — not live write</span>
          </li>
          <li>
            <b>Claim</b>
            <span>Decision support · not clinical certification</span>
          </li>
        </ul>
      </Tile>
      <Tile title="Queue · needs a clinician" aside={<Chip tone="ai">CONDUCTOR brief</Chip>} span="queue">
        <Worklist
          rows={[
            {
              dot: "red",
              name: "A. Mensah · Guardian hold",
              detail: "Low glucose draft · urgent gate",
              chip: <Chip tone="red">Human gate</Chip>,
            },
            {
              dot: "amber",
              name: "J. Okafor · Synthesis note",
              detail: "HbA1c rising · accept / edit / reject",
              chip: <Chip tone="amber">In review</Chip>,
            },
            {
              dot: "teal",
              name: "R. Patel · lab correlation",
              detail: "eGFR 52 · LOINC from feed",
              chip: <Chip tone="teal">Provenance</Chip>,
            },
          ]}
        />
      </Tile>
      <Tile title="Draft at the gate" span="draft">
        <Draft
          agent="Synthesis"
          title="Consultation note"
          body="Rising HbA1c with incomplete CGM wear. Suggest treatment review — clinician decides."
          status="Waiting for named clinician"
        />
      </Tile>
    </>
  );
}

function StrategyBody() {
  return (
    <>
      <Tile title="Patient context" aside={<Chip>Patient-reported + lab</Chip>} span="ctx">
        <Stats
          items={[
            { value: "68", label: "HbA1c mmol/mol" },
            { value: "48%", label: "Time in range" },
            { value: "Missing", label: "Last foot exam" },
          ]}
        />
        <p className="c-text">Gaps stay gaps. Nothing is invented to complete the picture.</p>
      </Tile>
      <Tile
        title="Personalised strategy draft"
        aside={<Chip tone="ai">AI draft · in validation</Chip>}
        span="plan"
        className="c-tile--hero"
      >
        <ol className="c-plan">
          <li>
            <b>Review nocturnal hypos</b>
            <small>Patient-reported ×2 last week · not a dose change</small>
          </li>
          <li>
            <b>Confirm CGM wear pattern</b>
            <small>Two evenings off · data sufficiency flagged</small>
          </li>
          <li>
            <b>Discuss treatment options</b>
            <small>Talking points only · prescriber confirms any medicine decision</small>
          </li>
        </ol>
        <div className="c-actions" aria-hidden>
          <span>Reject</span>
          <span>Edit</span>
          <span className="is-primary">Accept</span>
        </div>
      </Tile>
      <Tile title="What this is not" span="limits">
        <p className="c-text">
          Not autonomous prescribing. Not a certified clinical device claim. Not a silent write to your
          records system.
        </p>
      </Tile>
    </>
  );
}

function HandoffBody() {
  return (
    <>
      <Tile title="Care episode" aside={<Chip tone="teal">Shared run id</Chip>} span="episode">
        <Timeline
          steps={[
            { t: "CONDUCTOR orchestrated", d: "Brief + Guardian order · synthetic eval", state: "done" },
            { t: "Clinician accepted note", d: "Named account · audit chained", state: "done" },
            { t: "Lab queue · human review", d: "eGFR flag for admin/lab role", state: "now" },
            { t: "Pharmacy queue", d: "Held — no Rx without prescriber", state: "next" },
          ]}
        />
      </Tile>
      <Tile title="Lab queue" span="lab">
        <Worklist
          rows={[
            {
              dot: "amber",
              name: "eGFR below 60",
              detail: "Rule kidney.egfr_below_60 · KDIGO cite",
              chip: <Chip tone="amber">HITL</Chip>,
            },
            {
              dot: "grey",
              name: "ALT",
              detail: "Not on record",
              chip: <Chip>Missing</Chip>,
            },
          ]}
        />
      </Tile>
      <Tile title="Pharmacy queue" span="rx">
        <Draft
          agent="Guardian"
          title="Interaction check"
          body="Flagged for prescriber confirmation. Aksh does not change doses or issue EPS scripts."
          status="Held for prescriber"
        />
      </Tile>
    </>
  );
}

function OpsBody() {
  return (
    <>
      <Tile title="Evaluation honesty" aside={<Chip tone="amber">Synthetic eval</Chip>} span="honest">
        <ul className="c-honesty">
          <li>
            <b>Live-path</b>
            <span>Agents with a real review path</span>
          </li>
          <li>
            <b>Scaffold</b>
            <span>PRISM / ATLAS · synthetic eval only</span>
          </li>
          <li>
            <b>Sim</b>
            <span>Lab/pharmacy adapters · not live EHR</span>
          </li>
        </ul>
      </Tile>
      <Tile title="HCP eval session" span="hcp">
        <Big value="Facilitated" label="synthetic cases · trust scores · safety misses logged" />
        <p className="c-text">Meeting numeric targets does not release an agent. A clinical safety officer signs off.</p>
      </Tile>
      <Tile title="SHIELD / Guardian" span="shield">
        <Worklist
          rows={[
            {
              dot: "teal",
              name: "SHIELD audit",
              detail: "Hash-chained decisions · tamper-evident",
            },
            {
              dot: "lime",
              name: "Guardian gate",
              detail: "Safety holds before drafts reach the queue",
              chip: <Chip tone="lime">Gate</Chip>,
            },
          ]}
        />
      </Tile>
    </>
  );
}

function Body({ id }: { id: ProductSurfaceId }) {
  switch (id) {
    case "review":
      return <ReviewBody />;
    case "strategy":
      return <StrategyBody />;
    case "handoff":
      return <HandoffBody />;
    case "ops":
      return <OpsBody />;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function ProductSurface({ id }: { id: ProductSurfaceId }) {
  return (
    <SurfaceFrame id={id}>
      <Body id={id} />
    </SurfaceFrame>
  );
}
