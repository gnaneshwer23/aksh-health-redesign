"use client";

import Link from "next/link";
import { useState } from "react";

import { NewsCardMotif } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const tabs = ["Updates", "Safety", "Integrations", "Roles", "Demos"] as const;

const cards: Record<(typeof tabs)[number], Array<{ tag: string; title: string; href: string; tone: "navy" | "mint" | "ink" }>> = {
  Updates: [
    { tag: "Platform", title: "Capture → draft → approve with clinician review on every output", href: "/platform", tone: "navy" },
    { tag: "Roadmap", title: "Precision Health scaffolding — honest Phase 1–3 status", href: "/resources#precision-health", tone: "mint" },
    { tag: "Walkthrough", title: "See the Patel practice journey end to end", href: "/walkthrough", tone: "ink" },
  ],
  Safety: [
    { tag: "Security", title: "Clinical safety posture and audit trails", href: "/security", tone: "navy" },
    { tag: "Privacy", title: "How we handle sensitive health data", href: "/privacy", tone: "mint" },
    { tag: "Compliance", title: "DCB0129 safety case work in progress", href: "/resources", tone: "ink" },
  ],
  Integrations: [
    { tag: "EMIS", title: "Designed for EMIS Web integration paths", href: "/integrations", tone: "navy" },
    { tag: "SystmOne", title: "SystmOne-ready coordination flows", href: "/integrations", tone: "mint" },
    { tag: "FHIR", title: "R4 resources staged after approval", href: "/how-it-works", tone: "ink" },
  ],
  Roles: [
    { tag: "GP", title: "Documentation and review for clinicians", href: "/for-clinicians", tone: "navy" },
    { tag: "ICS", title: "Population view across integrated care", href: "/for-ics", tone: "mint" },
    { tag: "Hospital", title: "Command centre for trust executives", href: "/for-hospitals", tone: "ink" },
  ],
  Demos: [
    { tag: "Walkthrough", title: "See the product walkthrough", href: "/walkthrough", tone: "navy" },
    { tag: "Pilot", title: "Discuss a pilot with the team", href: "/get-started", tone: "mint" },
    { tag: "Account", title: "Create your account", href: "/signup", tone: "ink" },
  ],
};

export default function WhatsNewSection() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Updates");

  return (
    <section className="owkin-whats-new" aria-labelledby="whats-new-heading">
      <div className={container}>
        <ScrollReveal>
          <h2 id="whats-new-heading" className="owkin-whats-new__title">
            What&apos;s new at Aksh Health?
          </h2>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <div className="owkin-whats-new__tabs" role="tablist" aria-label="Updates categories">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active === tab}
                className={active === tab ? "is-active" : undefined}
                onClick={() => setActive(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className="owkin-whats-new__grid" role="tabpanel">
          {cards[active].map((card, index) => (
            <ScrollReveal key={`${active}-${card.title}`} delayMs={100 + index * 60}>
              <Link href={card.href} className={`owkin-news-card owkin-news-card--${card.tone}`}>
                <span className="owkin-news-card__tag">{card.tag}</span>
                <NewsCardMotif tone={card.tone} />
                <h3>{card.title}</h3>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
