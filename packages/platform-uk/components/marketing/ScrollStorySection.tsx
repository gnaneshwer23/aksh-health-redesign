import Link from "next/link";

import { ProductSceneVisual } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const scenes = [
  {
    id: "fragmented",
    title: "Clinical work is profoundly fragmented",
    body: "Notes, meds, referrals, and handovers still live across EMIS Web, SystmOne, and inbox chaos. Teams spend the day reconciling systems instead of practising medicine.",
    cta: { href: "/platform", label: "Explore the platform" },
    visual: "fragmented" as const,
  },
  {
    id: "answer",
    title: "A governed agent layer is the answer",
    body: "Eight specialist agents draft and check work against clinical context. Nothing reaches the record until a human accepts, edits, or rejects it — with a full audit trail.",
    cta: { href: "/how-it-works", label: "See how it works" },
    visual: "agents" as const,
  },
  {
    id: "improving",
    title: "Powered by FHIR. Continuously reviewed.",
    body: "Approved outputs stage as FHIR R4 resources ready for EMIS Web and SystmOne paths. Every decision is accountable; every write waits for clinician sign-off.",
    cta: { href: "/security", label: "Explore what makes this possible" },
    visual: "fhir" as const,
  },
] as const;

export default function ScrollStorySection() {
  return (
    <section className="owkin-story" aria-label="Why Aksh Health">
      {scenes.map((scene) => (
        <div key={scene.id} className="owkin-story__scene">
          <div className={`${container} owkin-story__grid`}>
            <ScrollReveal className="owkin-story__headline" delayMs={40}>
              <h2>{scene.title}</h2>
            </ScrollReveal>

            <ScrollReveal className="owkin-story__visual" delayMs={120}>
              <div className="owkin-story__visual-frame">
                <ProductSceneVisual variant={scene.visual} />
              </div>
            </ScrollReveal>

            <ScrollReveal className="owkin-story__copy" delayMs={200}>
              <p>{scene.body}</p>
              <Link href={scene.cta.href} className="owkin-text-cta">
                {scene.cta.label}
                <span aria-hidden>→</span>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      ))}
    </section>
  );
}
