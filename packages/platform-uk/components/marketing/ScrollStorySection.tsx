import Link from "next/link";

import { ProductSceneVisual } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const scenes = [
  {
    id: "fragmented",
    title: "Clinical work is profoundly fragmented",
    body: "Clinical information is spread across multiple systems, making coordination difficult and increasing administrative burden.",
    cta: { href: "/platform", label: "View platform" },
    visual: "fragmented" as const,
  },
  {
    id: "answer",
    title: "Coordinated drafts with a clinician gate",
    body: "Every consultation becomes a structured draft with supporting clinical checks, ready for clinician review before entering the record.",
    cta: { href: "/how-it-works", label: "View workflow" },
    visual: "voice" as const,
  },
  {
    id: "improving",
    title: "Built for EMIS, SystmOne, and FHIR",
    body: "Structured clinical information is prepared using FHIR standards and integrated with existing clinical systems through governed workflows.",
    cta: { href: "/security", label: "View security" },
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
