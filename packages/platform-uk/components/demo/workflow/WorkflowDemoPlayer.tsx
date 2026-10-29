"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import {
  demoControlDefaults,
  type WorkflowDemoEntry,
} from "@/lib/workflow-demos";
import { STATUS_LABEL, capability } from "@/lib/status/capabilities";

type Props = {
  entry: WorkflowDemoEntry;
  /** Initial variant from URL `/demo/:id/:variantId` or `?variant=` */
  initialVariantId?: string;
  /** Capture mode strips chrome for screenshots */
  capture?: boolean;
  children: (state: {
    step: string;
    decision: string;
    setStep: (s: string) => void;
    setDecision: (d: string) => void;
  }) => ReactNode;
};

export function WorkflowDemoPlayer({ entry, initialVariantId, capture = false, children }: Props) {
  const defaults = useMemo(() => demoControlDefaults(entry, initialVariantId), [entry, initialVariantId]);
  const [step, setStep] = useState(defaults.step ?? entry.controls[0]!.default);
  const [decision, setDecision] = useState(defaults.decision ?? "offer");
  const stepControl = entry.controls.find((c) => c.key === "step");
  const decisionControl = entry.controls.find((c) => c.key === "decision");
  const cap = capability(entry.capabilityId);
  const stepIndex = stepControl?.options.findIndex((o) => o.value === step) ?? 0;
  const stepCount = stepControl?.options.length ?? 1;

  if (capture) {
    return (
      <div className="wd-capture" data-capture-ready data-demo={entry.id} data-step={step}>
        {children({ step, decision, setStep, setDecision })}
      </div>
    );
  }

  return (
    <div className="wd" data-demo={entry.id} data-step={step}>
      <header className="wd-hero">
        <div className="s-container">
          <p className="s-eyebrow">Synthetic guided demo</p>
          <h1 className="s-h1" style={{ fontSize: "clamp(28px, 4vw, 42px)" }}>{entry.label}</h1>
          <p className="s-lede" style={{ maxWidth: 640 }}>{entry.description}</p>
          <div className="wd-meta" aria-label="Demo boundaries">
            <span className="c-chip c-chip--ink">Synthetic data only</span>
            <span className="c-chip c-chip--teal">{STATUS_LABEL[cap.status]}</span>
            <span className="c-chip">Staff / clinician decide</span>
            <span className="c-chip">{entry.duration}</span>
          </div>
          <p className="wd-disclosure">
            Illustrative walkthrough. No live patient data, no autonomous treatment changes, and no
            contact sent by Aksh. Your team always chooses.
          </p>
        </div>
      </header>

      <div className="s-container wd-layout">
        <aside className="wd-rail" aria-label="Demo controls">
          <div className="wd-rail__block">
            <h2 className="wd-rail__title">Journey</h2>
            <ol className="wd-steps">
              {stepControl?.options.map((opt, i) => {
                const done = i < stepIndex;
                const current = opt.value === step;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={`wd-step${current ? " is-on" : ""}${done ? " is-done" : ""}`}
                      aria-current={current ? "step" : undefined}
                      onClick={() => setStep(opt.value)}
                    >
                      <span className="wd-step__n">{i + 1}</span>
                      <span>{opt.label.replace(/^\d+\s*·\s*/, "")}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {decisionControl && (step === "decide" || step === "review" || step === "result") ? (
            <div className="wd-rail__block">
              <h2 className="wd-rail__title">{decisionControl.label}</h2>
              <p className="wd-rail__hint">Demo scenario knob — not a product setting.</p>
              <div className="wd-choices" role="radiogroup" aria-label={decisionControl.label}>
                {decisionControl.options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={decision === opt.value}
                    className={`wd-choice${decision === opt.value ? " is-on" : ""}`}
                    onClick={() => {
                      setDecision(opt.value);
                      if (step === "decide" || step === "review") {
                        /* stay; result shows outcome */
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="wd-rail__block">
            <h2 className="wd-rail__title">Variants</h2>
            <ul className="wd-variants">
              {entry.variants.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`${entry.href}?variant=${v.id}`}
                    className="wd-variant"
                    onClick={(e) => {
                      e.preventDefault();
                      const next = demoControlDefaults(entry, v.id);
                      setStep(next.step);
                      setDecision(next.decision);
                      window.history.replaceState(null, "", `${entry.href}?variant=${v.id}`);
                    }}
                  >
                    <b>{v.label}</b>
                    <span>{v.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="wd-nav">
            <button
              type="button"
              className="s-btn s-btn--ghost s-btn--sm"
              disabled={stepIndex <= 0}
              onClick={() => setStep(stepControl!.options[stepIndex - 1]!.value)}
            >
              Back
            </button>
            <button
              type="button"
              className="s-btn s-btn--primary s-btn--sm"
              disabled={stepIndex >= stepCount - 1}
              onClick={() => setStep(stepControl!.options[stepIndex + 1]!.value)}
            >
              Next
            </button>
          </div>
        </aside>

        <main className="wd-preview" aria-live="polite">
          {children({ step, decision, setStep, setDecision })}
        </main>
      </div>

      <div className="s-container" style={{ paddingBottom: 48 }}>
        <p className="s-small">
          <Link href="/demo" className="s-link">All demos</Link>
          {" · "}
          <Link href="/product" className="s-link">What’s available now</Link>
          {" · "}
          <Link href="/get-started" className="s-link">Request a pilot</Link>
        </p>
      </div>
    </div>
  );
}
