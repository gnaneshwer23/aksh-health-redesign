import Link from "next/link";

import { container, linkUnderline } from "@/components/marketing/marketing-ui";

const beats = [
  {
    title: "Clinical work is profoundly fragmented",
    body: "Clinical information is spread across multiple systems, making coordination difficult and increasing administrative burden.",
    href: "/platform",
    cta: "View platform",
  },
  {
    title: "Coordinated drafts with a clinician gate",
    body: "Every consultation becomes a structured draft with supporting clinical checks, ready for clinician review before entering the record.",
    href: "/how-it-works",
    cta: "View workflow",
  },
  {
    title: "Built for EMIS, SystmOne, and FHIR",
    body: "Structured clinical information is prepared using FHIR standards and integrated with existing clinical systems through governed workflows.",
    href: "/security",
    cta: "View security",
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
