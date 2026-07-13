import Link from "next/link";

import {
  FloatingChip,
  PanelChip,
  ProductSceneVisual,
} from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const scenes = [
  {
    id: "fragmented",
    title: "Clinical work is profoundly fragmented",
    body: "Notes, meds, referrals, and handovers still live across EMIS Web, SystmOne, and inbox chaos. Teams spend the day reconciling systems instead of practising medicine.",
    cta: { href: "/platform", label: "Explore the platform" },
    visual: "fragmented" as const,
    chips: "none" as const,
  },
  {
    id: "answer",
    title: "A governed agent layer is the answer",
    body: "Twelve specialist agents draft and check work against clinical context. Nothing reaches the record until a human accepts, edits, or rejects it — with a full audit trail.",
    cta: { href: "/how-it-works", label: "See how it works" },
    visual: "agents" as const,
    chips: "search" as const,
  },
  {
    id: "improving",
    title: "Powered by FHIR. Continuously reviewed.",
    body: "Approved outputs stage as FHIR R4 resources ready for EMIS Web and SystmOne paths. Every decision is accountable; every write waits for clinician sign-off.",
    cta: { href: "/security", label: "Explore what makes this possible" },
    visual: "fhir" as const,
    chips: "panels" as const,
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

                {scene.chips === "search" ? (
                  <>
                    <FloatingChip
                      label="VOICE · consult live"
                      sub="→ SYNTHESIS SOAP"
                      style={{ top: "8%", left: "2%" }}
                    />
                    <FloatingChip
                      label="ORACLE · risk 82"
                      sub="14-day admission"
                      style={{ top: "38%", right: "0%" }}
                    />
                    <FloatingChip
                      label="SHIELD · audit on"
                      sub="Zero auto-writes"
                      style={{ bottom: "12%", left: "8%" }}
                    />
                  </>
                ) : null}

                {scene.chips === "panels" ? (
                  <>
                    <PanelChip title="Clinician queue" className="owkin-story__panel owkin-story__panel--tl">
                      <div className="owkin-mini-graph" aria-hidden>
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </div>
                      <p className="owkin-panel-chip__meta">HITL · accept / edit / reject</p>
                    </PanelChip>
                    <PanelChip title="FHIR staging" className="owkin-story__panel owkin-story__panel--br">
                      <div className="owkin-filter-pills" aria-hidden>
                        {["Encounter", "Medication", "Condition", "AuditEvent"].map((pill) => (
                          <span key={pill}>{pill}</span>
                        ))}
                      </div>
                      <p className="owkin-panel-chip__meta">R4 · EMIS / SystmOne paths</p>
                    </PanelChip>
                  </>
                ) : null}
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
