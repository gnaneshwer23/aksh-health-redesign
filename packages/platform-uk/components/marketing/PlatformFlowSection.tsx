import Link from "next/link";

import { container } from "@/components/marketing/marketing-ui";

/** Compact clinician-gate band — signature control message. */
export default function PlatformFlowSection() {
  return (
    <section className="owkin-clinician-gate" aria-labelledby="clinician-gate-heading" data-section="08">
      <div className={`${container} owkin-clinician-gate__inner`}>
        <p className="owkin-clinician-gate__eyebrow">Clinician control</p>
        <h2 id="clinician-gate-heading" className="owkin-clinician-gate__title">
          Every output is a draft
          <span className="block">until a named clinician decides.</span>
        </h2>
        <p className="owkin-clinician-gate__lede">
          AI doesn&apos;t get the final say. Accept, edit, or reject before anything reaches the record. Every decision
          is attributed.
        </p>

        <div className="owkin-clinician-gate__actions">
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
