"use client";

import { useState } from "react";
import Link from "next/link";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";
import { cn } from "@/lib/utils";

const steps = [
  { id: "01", label: "ETL", detail: "Synthetic chart context assembled for review." },
  { id: "02", label: "Clinician dashboard", detail: "Authorised patient picture for the signed-in role." },
  { id: "03", label: "VOICE", detail: "Consultation capture into structured context." },
  { id: "04", label: "AI review", detail: "Drafts, evidence and safety wait in one queue." },
  { id: "05", label: "Pathway", detail: "Referral package staged for clinician decision." },
  { id: "06", label: "Pharmacy", detail: "Medication review with recorded rationale." },
  { id: "07", label: "Audit", detail: "Who drafted, reviewed and decided is recorded." },
  { id: "08", label: "Population", detail: "Governed aggregate view — synthetic proof mode." },
] as const;

export default function PatelJourneySection() {
  const [active, setActive] = useState(0);
  const current = steps[active]!;

  return (
    <section
      className="owkin-patel-journey bg-white"
      aria-labelledby="patel-journey-heading"
      data-section="08b"
    >
      <div className={`${container} py-16 md:py-20`}>
        <ScrollReveal>
          <p className="owkin-roles__eyebrow">See Aksh in action</p>
          <h2 id="patel-journey-heading" className="owkin-whats-new__title max-w-3xl">
            See Aksh work through a clinical case.
          </h2>
          <p className="owkin-one-platform__lede mt-4 max-w-2xl">
            <strong>Mr James Patel</strong> · Synthetic patient · Diabetes care. Proof-mode demonstration with no
            production claims.
          </p>
        </ScrollReveal>

        <div className="aksh-patel-timeline mt-10">
          <div className="aksh-patel-timeline__steps" role="tablist" aria-label="Patel walkthrough steps">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={index === active}
                className={cn("aksh-patel-timeline__step", index === active && "is-active")}
                onClick={() => setActive(index)}
              >
                <span>{step.id}</span>
                {step.label}
              </button>
            ))}
          </div>
          <div className="aksh-patel-timeline__panel" role="tabpanel">
            <p className="aksh-patel-timeline__index">{current.id}</p>
            <h3>{current.label}</h3>
            <p>{current.detail}</p>
            <Link href="/demo/patel" className="owkin-text-cta mt-4 inline-flex">
              Explore the Patel walkthrough
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
