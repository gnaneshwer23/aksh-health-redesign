import Link from "next/link";

import { container, linkUnderline } from "@/components/marketing/marketing-ui";

const beats = [
  {
    title: "Clinical work is profoundly fragmented",
    body: "Notes, meds, referrals, and handovers still live across EMIS Web, SystmOne, and inbox chaos. Teams spend the day reconciling systems instead of practising medicine.",
    href: "/platform",
    cta: "Explore the platform",
  },
  {
    title: "A governed agent layer is the answer",
    body: "Eight specialist agents draft and check work against clinical context. Nothing reaches the record until a human accepts, edits, or rejects it — with a full audit trail.",
    href: "/how-it-works",
    cta: "See how it works",
  },
  {
    title: "Powered by FHIR. Continuously reviewed.",
    body: "Approved outputs stage as FHIR R4 resources ready for EMIS Web and SystmOne paths. Every decision is accountable; every write waits for clinician sign-off.",
    href: "/security",
    cta: "Review safety posture",
  },
] as const;

export default function EditorialNarrativeSection() {
  return (
    <section className="marketing-narrative" aria-label="Why Aksh Health">
      <div className={container}>
        <div className="marketing-narrative__list">
          {beats.map((beat) => (
            <article key={beat.title} className="marketing-narrative__beat">
              <h2 className="marketing-narrative__title">{beat.title}</h2>
              <div className="marketing-narrative__copy">
                <p>{beat.body}</p>
                <Link href={beat.href} className={linkUnderline}>
                  {beat.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
