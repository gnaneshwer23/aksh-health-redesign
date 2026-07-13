import Link from "next/link";

import { btnInk, btnLg, container, linkUnderline, sectionTight } from "@/components/marketing/marketing-ui";

export default function PlatformMetricsSection() {
  return (
    <section className={`${sectionTight} marketing-editorial-band`} aria-labelledby="visibility-heading">
      <div className={`${container} grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16`}>
        <div>
          <p className="marketing-section-label mb-4">Platform overview</p>
          <h2
            id="visibility-heading"
            className="marketing-display-title mb-5 max-w-lg text-[clamp(1.85rem,3.4vw,2.75rem)] text-navy-dark"
          >
            Visibility into every agent, every review
          </h2>
          <p className="max-w-md text-base leading-relaxed text-slate/75 sm:text-lg">
            Practice managers and ICS leads see agent throughput and review-queue activity without leaving the
            platform — with clinician approval still required on every output.
          </p>
        </div>

        <div className="marketing-metric-rail" role="list" aria-label="Platform outcome signals">
          {[
            { value: "12", label: "Agent outputs drafted" },
            { value: "HITL", label: "Review queue turnaround" },
            { value: "100%", label: "Every output audited" },
            { value: "R4", label: "FHIR resources staged" },
          ].map((metric) => (
            <div key={metric.label} className="marketing-metric-rail__item" role="listitem">
              <p className="marketing-metric-rail__value">{metric.value}</p>
              <p className="marketing-metric-rail__label">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${container} mt-12 flex flex-wrap items-center gap-5`}>
        <Link href="/platform" className={`${btnInk} ${btnLg}`}>
          Discover the platform
        </Link>
        <Link href="/demo/patel" className={linkUnderline}>
          Book a walkthrough with our team
        </Link>
      </div>
    </section>
  );
}
