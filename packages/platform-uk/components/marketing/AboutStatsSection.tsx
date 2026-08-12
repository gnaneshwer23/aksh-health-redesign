import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { container, linkUnderline, section } from "@/components/marketing/marketing-ui";

const points = [
  "Designed to sit beside your existing EHR (FHIR staging)",
  "Eight specialist agents covering clinical, safety, and operational work",
  "Nothing writes to the record without clinician approval",
] as const;

export default function AboutStatsSection() {
  return (
    <section className={`${section} marketing-editorial-band`} aria-labelledby="platform-care-heading">
      <div className={`${container} grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20`}>
        <div>
          <p className="marketing-section-label mb-4">Our platform</p>
          <h2
            id="platform-care-heading"
            className="marketing-display-title mb-5 max-w-xl text-[clamp(1.85rem,3.4vw,2.75rem)] text-navy-dark"
          >
            Built for every stage of clinical care
          </h2>
          <p className="mb-8 max-w-lg text-base leading-relaxed text-slate/75 sm:text-lg">
            One platform standing beside your clinical team: specialist agents draft, check, and coordinate, while
            clinicians stay in control of every decision that reaches the record.
          </p>

          <ul className="space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-slate sm:text-base">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="marketing-stage-stack">
          <article className="marketing-stage-stack__panel">
            <p className="marketing-section-label mb-3">Review</p>
            <h3 className="marketing-display-title mb-3 text-2xl text-navy-dark">Human review, every time</h3>
            <p className="text-sm leading-relaxed text-slate/75 sm:text-base">
              Every agent output lands in a review queue. Clinicians accept, edit, or reject before anything reaches
              the record.
            </p>
          </article>
          <article className="marketing-stage-stack__panel">
            <p className="marketing-section-label mb-3">Staging</p>
            <h3 className="marketing-display-title mb-3 text-2xl text-navy-dark">FHIR R4 staging</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate/75 sm:text-base">
              Approved outputs stage as FHIR resources with an immutable audit trail, ready for exchange with
              existing clinical systems.
            </p>
            <Link href="/platform" className={linkUnderline}>
              Follow the full journey
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
