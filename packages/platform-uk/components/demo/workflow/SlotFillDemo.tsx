"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { Bars, Big, Chip, Tile, Timeline, Worklist } from "@/components/site/canvas/tiles";
import { workflowDemo } from "@/lib/workflow-demos";

import { WorkflowDemoPlayer } from "./WorkflowDemoPlayer";

function Frame({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <figure className="c-canvas wd-frame" data-canvas="slots" aria-label={`${title} (illustrative, synthetic data)`}>
      <div className="c-main" style={{ width: "100%" }}>
        <header className="c-head">
          <div>
            <span className="c-head__hello">Riverside Diabetes Centre · Thursday</span>
            <h3 className="c-head__title">{title}</h3>
          </div>
          <div className="c-head__right">
            <Chip tone="ink">Synthetic data</Chip>
            <Chip tone="amber">Shadow mode</Chip>
          </div>
        </header>
        <div className="wd-frame__body">{children}</div>
        <figcaption className="c-caption">
          Illustrative example · synthetic patients · staff choose and contact; Aksh never contacts patients
        </figcaption>
      </div>
    </figure>
  );
}

function Scene({ step, decision, setStep }: { step: string; decision: string; setStep: (s: string) => void }) {
  if (step === "event") {
    return (
      <Frame title="Freed slot received">
        <Tile title="Diabetes review · Thu 09:40" aside={<Chip tone="amber">Just arrived</Chip>}>
          <Timeline
            steps={[
              { t: "Slot received from your schedule", d: "Diabetes review · 20 minutes · site Main", state: "now" },
              { t: "Waiting list match running", d: "Rules: notice, site, opt-outs, offer limits", state: "next" },
              { t: "Staff choose who to offer", d: "Aksh never contacts patients", state: "next" },
              { t: "Schedule confirms booking", d: "Only then counted as filled", state: "next" },
            ]}
          />
        </Tile>
      </Frame>
    );
  }

  if (step === "rank") {
    return (
      <Frame title="Ranked worklist with reasons">
        <div className="wd-split">
          <Tile title="Who fits · ranked" aside={<Chip tone="lime">3 eligible</Chip>}>
            <Worklist
              rows={[
                { dot: "lime", name: "1 · R. Okafor", detail: "Overdue care · waiting since 12 Aug · fits notice", chip: <Chip tone="lime">Eligible</Chip> },
                { dot: "lime", name: "2 · M. Haddad", detail: "Patient asked · waiting since 3 Sep", chip: <Chip tone="lime">Eligible</Chip> },
                { dot: "lime", name: "3 · A. Chen", detail: "Clinician request · flexible evenings", chip: <Chip tone="lime">Eligible</Chip> },
                { dot: "grey", name: "J. Lindqvist", detail: "Needs 24 h notice · slot is tomorrow", chip: <Chip>Not offered · reason shown</Chip> },
              ]}
            />
          </Tile>
          <Tile title="Why this order">
            <p className="c-text">
              Your clinic ranks overdue care first, then patient request, then clinician request. Opt-outs and
              offer limits are applied before ranking.
            </p>
          </Tile>
        </div>
      </Frame>
    );
  }

  if (step === "decide") {
    return (
      <Frame title="Staff decision">
        <Tile title="Diabetes review · Thu 09:40" aside={<Chip tone="amber">Needs a named person</Chip>}>
          <Worklist
            rows={[
              { dot: "lime", name: "1 · R. Okafor", detail: "Overdue care · waiting since 12 Aug", chip: <Chip tone="lime">Top match</Chip> },
              { dot: "lime", name: "2 · M. Haddad", detail: "Patient asked · waiting since 3 Sep", chip: <Chip tone="lime">Eligible</Chip> },
            ]}
          />
          <div className="c-actions" role="group" aria-label="Staff actions">
            <button type="button" className="is-primary" onClick={() => setStep("result")}>
              Draft offer
            </button>
            <button type="button" onClick={() => setStep("result")}>
              Skip with reason
            </button>
            <button type="button" onClick={() => setStep("result")}>
              Hand off
            </button>
          </div>
          <p className="c-text" style={{ marginTop: 12 }}>
            Selected scenario:{" "}
            <b>
              {decision === "offer"
                ? "Draft offer to top match"
                : decision === "skip"
                  ? "Skip with reason"
                  : "Hand off to reception"}
            </b>
            . Advance to see the recorded result, or change the scenario knob.
          </p>
        </Tile>
      </Frame>
    );
  }

  if (decision === "skip") {
    return (
      <Frame title="Recorded result · skipped">
        <Tile title="Audit · skip with reason" aside={<Chip>Immutable</Chip>}>
          <Timeline
            steps={[
              { t: "Slot received", d: "Thu 09:40 · diabetes review", state: "done" },
              { t: "3 ranked, 1 not eligible", d: "Reasons shown", state: "done" },
              { t: "Staff skipped R. Okafor", d: "Reason: patient abroad this week · recorded under signed-in account", state: "now" },
              { t: "Next eligible remains on list", d: "M. Haddad still waiting", state: "next" },
            ]}
          />
        </Tile>
      </Frame>
    );
  }

  if (decision === "handoff") {
    return (
      <Frame title="Recorded result · hand-off">
        <Tile title="Hand-off · reception" aside={<Chip tone="red">Due 16:00</Chip>}>
          <Timeline
            steps={[
              { t: "Offer drafted by staff", d: "Sent through clinic SMS channel", state: "done" },
              { t: "Patient accepted verbally", d: "Waiting for schedule read-back", state: "done" },
              { t: "Booking not seen in schedule", d: "Aksh does not count as filled", state: "now" },
              { t: "Hand-off created", d: "Owner: reception · due today 16:00", state: "now" },
            ]}
          />
        </Tile>
      </Frame>
    );
  }

  return (
    <Frame title="Recorded result · offer">
      <div className="wd-split">
        <Tile title="Slot history" aside={<Chip tone="teal">Counted when confirmed</Chip>}>
          <Timeline
            steps={[
              { t: "Slot received from your schedule", d: "Thu 09:40 · diabetes review", state: "done" },
              { t: "3 ranked, 1 not eligible", d: "Reasons shown for each", state: "done" },
              { t: "Offer approved by staff", d: "Sent through your own channel", state: "done" },
              { t: "Booking confirmed by the schedule", d: "Only now counted as filled", state: "now" },
            ]}
          />
        </Tile>
        <Tile title="Fill rate this week">
          <Big value="68" unit="%" label="against a locked baseline of 41%" />
          <Bars values={[38, 44, 52, 49, 61, 68]} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} highlight={5} height={110} unit="%" max={80} />
        </Tile>
      </div>
    </Frame>
  );
}

function SlotFillDemoInner() {
  const params = useSearchParams();
  const capture = params.get("capture") === "preview";
  const variant = params.get("variant") ?? undefined;
  const entry = workflowDemo("slot-fill");

  return (
    <WorkflowDemoPlayer entry={entry} initialVariantId={variant} capture={capture}>
      {(state) => <Scene step={state.step} decision={state.decision} setStep={state.setStep} />}
    </WorkflowDemoPlayer>
  );
}

export function SlotFillDemo() {
  return (
    <Suspense fallback={<div className="s-container" style={{ padding: 48 }}>Loading demo…</div>}>
      <SlotFillDemoInner />
    </Suspense>
  );
}
