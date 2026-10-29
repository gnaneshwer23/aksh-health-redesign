"use client";

/**
 * Homepage preview: structured diabetes history → clinician summary.
 * Inspired by calm dual-path intake storytelling (patient voice → clinician note),
 * but Aksh-specific: diabetes review prep, missing-data honesty, human gate, synthetic only.
 * In validation — not a live clinical product claim.
 */
import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { StatusPill } from "@/components/site/StatusPill";

type StepId = "share" | "structure" | "decide";

const STEPS: { id: StepId; n: string; label: string; title: string; body: string }[] = [
  {
    id: "share",
    n: "01",
    label: "Patient shares",
    title: "In their own words, before the visit",
    body: "Hypos, medicines, feet, sensor wear and what has changed since the last review — one question at a time, not a long form.",
  },
  {
    id: "structure",
    n: "02",
    label: "Aksh structures",
    title: "One diabetes history the team can scan",
    body: "Answers become sections a clinician can read in a minute. Gaps stay gaps — never filled in by guessing.",
  },
  {
    id: "decide",
    n: "03",
    label: "Clinician decides",
    title: "A named person accepts, edits or rejects",
    body: "The draft stops at the human gate. Nothing is written to the record until someone signed in says so.",
  },
];

const PATIENT_LINES = [
  { q: "Any hypos since your last review?", a: "Two nights last week — woke shaky around 3am. Treated with juice." },
  { q: "Medicines as prescribed?", a: "Metformin morning and evening. Missed the Friday evening dose once." },
  { q: "Feet — any cuts, numbness or colour change?", a: "Left big toe feels numb more often. No open sores that I have noticed." },
  { q: "CGM wear in the last 14 days?", a: "Sensor on most days. Took it off for two evenings for a wedding." },
];

const CLINICIAN_BLOCKS = [
  { k: "Concerns", v: "Nocturnal hypos ×2 last week · left hallux numbness (patient-reported)" },
  { k: "Medicines", v: "Metformin BD · one missed evening dose noted" },
  { k: "Glucose context", v: "CGM wear incomplete (2 evenings off) · review time-below-range" },
  { k: "Missing", v: "Date of last foot examination — not provided", missing: true },
];

export function DiabetesHistoryPreview() {
  const baseId = useId();
  const [step, setStep] = useState<StepId>("share");
  const [entered, setEntered] = useState(false);
  const active = STEPS.find((s) => s.id === step) ?? STEPS[0]!;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setEntered(true);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), 40);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <section className="s-section s-hist" id="review-prep" data-history-preview style={{ scrollMarginTop: 80 }}>
      <div className="s-container">
        <div className="s-hist__head">
          <div className="s-hist__intro">
            <div className="s-row" style={{ justifyContent: "flex-start", gap: 12, marginBottom: 12 }}>
              <span className="s-eyebrow">Review preparation</span>
              <StatusPill s="in_validation" />
            </div>
            <h2 className="s-h2">
              The diabetes story arrives <span className="s-grad">ready for the clinician.</span>
            </h2>
            <p className="s-lede" style={{ marginTop: 16 }}>
              After slot fill and glucose monitoring, the next layer is structured history for the annual or interim
              review: patient answers in plain language, a draft summary for the clinician, and a clear stop before
              anything is saved. In validation on synthetic patients — not used for real care until release criteria
              are met.
            </p>
          </div>
          <div className="s-hist__aside">
            <p className="s-small" style={{ margin: 0 }}>
              Builds on notes-and-coding drafts and the clinical review queue. Complements cancelled-slot fill and CGM
              worklists — it does not diagnose, prescribe or contact patients.
            </p>
            <div className="s-actions" style={{ marginTop: 16 }}>
              <Link href="/demo" className="s-btn s-btn--primary s-btn--sm">
                Explore a demo
              </Link>
              <Link href="/get-started" className="s-btn s-btn--ghost s-btn--sm">
                Request a pilot
              </Link>
            </div>
          </div>
        </div>

        <div className="s-hist__stage" data-step={step}>
          <div className="s-hist__tabs" role="tablist" aria-label="How review preparation works">
            {STEPS.map((s) => {
              const selected = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${s.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  className={`s-hist__tab${selected ? " is-on" : ""}`}
                  onClick={() => {
                    setEntered(false);
                    setStep(s.id);
                  }}
                >
                  <span className="s-hist__tab-n">{s.n}</span>
                  <span className="s-hist__tab-label">{s.label}</span>
                </button>
              );
            })}
          </div>

          <div
            className={`s-hist__panel${entered ? " is-in" : ""}`}
            role="tabpanel"
            id={`${baseId}-panel`}
            aria-labelledby={`${baseId}-tab-${step}`}
          >
            <div className="s-hist__copy">
              <p className="s-mono">Step {active.n} of 03</p>
              <h3 className="s-h3">{active.title}</h3>
              <p className="s-body">{active.body}</p>
            </div>

            <div className="s-hist__dual" aria-label="Illustrative patient and clinician views, synthetic data">
              <article className={`s-hist__pane s-hist__pane--patient${step === "share" ? " is-focus" : ""}`}>
                <header className="s-hist__pane-head">
                  <span>Patient · before the visit</span>
                  <span className="s-pill s-pill--grey">Synthetic</span>
                </header>
                <ol className="s-hist__qa">
                  {PATIENT_LINES.map((line, i) => (
                    <li key={line.q} className="is-shown" style={{ animationDelay: `${i * 70}ms` }}>
                      <p className="s-hist__q">{line.q}</p>
                      <p className="s-hist__a">{line.a}</p>
                    </li>
                  ))}
                </ol>
              </article>

              <article className={`s-hist__pane s-hist__pane--clinic${step !== "share" ? " is-focus" : ""}`}>
                <header className="s-hist__pane-head">
                  <span>Clinician · draft summary</span>
                  <span className="s-pill s-pill--amber">DRAFT · human gate</span>
                </header>
                <dl className="s-hist__blocks">
                  {CLINICIAN_BLOCKS.map((b) => (
                    <div key={b.k} className={b.missing ? "is-missing" : undefined}>
                      <dt>{b.k}</dt>
                      <dd>{b.v}</dd>
                    </div>
                  ))}
                </dl>
                <footer className="s-hist__gate" aria-hidden={step !== "decide"}>
                  <span className={step === "decide" ? "is-on" : undefined}>Accept</span>
                  <span className={step === "decide" ? "is-on" : undefined}>Edit</span>
                  <span className={step === "decide" ? "is-on" : undefined}>Reject</span>
                </footer>
              </article>
            </div>
          </div>
        </div>

        <p className="s-hist__footnote s-small">
          Illustrative example · synthetic patient · structured summary only · a signed-in clinician must accept, edit
          or reject before anything is stored.{" "}
          <Link href="/agents" className="s-link">
            How agents stop at the clinician →
          </Link>
        </p>
      </div>
    </section>
  );
}
