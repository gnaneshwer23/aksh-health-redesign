"use client";

import { useState } from "react";
import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

type Decision = "idle" | "accept" | "edit" | "reject";

export default function ClinicalControlSection() {
  const [decision, setDecision] = useState<Decision>("idle");

  return (
    <section
      className="owkin-clinical-control bg-white"
      aria-labelledby="clinical-control-heading"
      data-section="05b"
    >
      <div className={`${container} py-16 md:py-24`}>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="owkin-roles__eyebrow">The Aksh principle</p>
          <h2 id="clinical-control-heading" className="owkin-whats-new__title">
            AI doesn&apos;t get the final say.
          </h2>
          <p className="owkin-one-platform__lede mx-auto mt-4">
            Every clinical output is a draft until a named clinician decides.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={80} className="mt-12">
          <div className="aksh-review-stage" data-testid="clinical-review-stage">
            <div className="aksh-review-stage__panel aksh-review-stage__panel--context">
              <p className="aksh-review-stage__eyebrow">Patient context · synthetic</p>
              <h3>Mr James Patel</h3>
              <p className="aksh-review-stage__meta">Diabetes · medication history · recent labs</p>
              <dl className="aksh-review-stage__facts">
                <div>
                  <dt>HbA1c</dt>
                  <dd>72 mmol/mol</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>2 sources</dd>
                </div>
                <div>
                  <dt>Missing</dt>
                  <dd>Adherence not recorded</dd>
                </div>
              </dl>
            </div>

            <div className="aksh-review-stage__panel aksh-review-stage__panel--draft">
              <div className="aksh-review-stage__badges">
                <span className="aksh-status aksh-status--draft">AI draft</span>
                {decision === "accept" ? (
                  <span className="aksh-status aksh-status--accepted">Accepted</span>
                ) : null}
                {decision === "reject" ? (
                  <span className="aksh-status aksh-status--rejected">Rejected</span>
                ) : null}
                {decision === "edit" ? (
                  <span className="aksh-status aksh-status--review">Edit mode</span>
                ) : null}
                {decision === "idle" ? (
                  <span className="aksh-status aksh-status--review">Review required</span>
                ) : null}
              </div>
              <h3>Clinical summary</h3>
              <p>
                Patient reports calf swelling and elevated glucose readings. Potential concern: urgent clinical review
                required.
              </p>
              <ul>
                <li>Evidence · HbA1c 72 mmol/mol</li>
                <li>Consultation note</li>
                <li>Medication history</li>
              </ul>
            </div>

            <div className="aksh-review-stage__panel aksh-review-stage__panel--decision">
              <p className="aksh-review-stage__eyebrow">Clinician decision</p>
              <div className="aksh-review-stage__actions" role="group" aria-label="Demo clinician decisions">
                <button
                  type="button"
                  className={cn("aksh-decision-btn aksh-decision-btn--reject", decision === "reject" && "is-active")}
                  onClick={() => setDecision("reject")}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className={cn("aksh-decision-btn aksh-decision-btn--edit", decision === "edit" && "is-active")}
                  onClick={() => setDecision("edit")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={cn("aksh-decision-btn aksh-decision-btn--accept", decision === "accept" && "is-active")}
                  onClick={() => setDecision("accept")}
                >
                  Accept
                </button>
              </div>
              <p className="aksh-review-stage__auditor">
                Reviewer · Dr Sarah Williams
                <span>10:42 · Audit recorded</span>
              </p>
              <p className="aksh-review-stage__demo-note">Interactive demo · synthetic patient · not a live EHR write</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/security" className="owkin-btn-ink">
            Security &amp; clinical safety
          </Link>
          <Link href="/demo/patel" className="owkin-text-cta">
            Open Patel walkthrough
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
