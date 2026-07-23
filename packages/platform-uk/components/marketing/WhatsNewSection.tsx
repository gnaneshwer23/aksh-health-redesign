"use client";

import Link from "next/link";
import { useState } from "react";

import { NewsCardMotif } from "@/components/marketing/OwkinVisuals";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { container } from "@/components/marketing/marketing-ui";

const tabs = ["Platform", "Security", "Integrations", "Clinical workflows"] as const;

const cards: Record<
  (typeof tabs)[number],
  Array<{ tag: string; title: string; href: string; tone: "navy" | "mint" | "ink" }>
> = {
  Platform: [
    {
      tag: "Workflow",
      title: "Capture → draft → approve with clinician review on every output",
      href: "/platform",
      tone: "navy",
    },
    {
      tag: "Governance",
      title: "Immutable audit trails across clinical decisions",
      href: "/security",
      tone: "mint",
    },
    {
      tag: "Workspaces",
      title: "Role-specific dashboards for care teams",
      href: "/platform#roles",
      tone: "ink",
    },
  ],
  Security: [
    { tag: "Security", title: "Clinical safety posture and audit trails", href: "/security", tone: "navy" },
    { tag: "Privacy", title: "How we handle sensitive health data", href: "/privacy", tone: "mint" },
    { tag: "Compliance", title: "Safety case work for regulated care settings", href: "/resources", tone: "ink" },
  ],
  Integrations: [
    { tag: "EMIS", title: "Designed for EMIS Web integration paths", href: "/integrations", tone: "navy" },
    { tag: "SystmOne", title: "Designed for SystmOne coordination flows", href: "/integrations", tone: "mint" },
    { tag: "FHIR", title: "Clinical information prepared with FHIR standards", href: "/how-it-works", tone: "ink" },
  ],
  "Clinical workflows": [
    { tag: "GP", title: "Documentation and review for clinicians", href: "/for-clinicians", tone: "navy" },
    { tag: "ICS", title: "Population view across integrated care", href: "/for-ics", tone: "mint" },
    { tag: "Hospital", title: "Command centre for trust executives", href: "/for-hospitals", tone: "ink" },
  ],
};

export default function WhatsNewSection() {
  const [active, setActive] = useState<(typeof tabs)[number]>("Platform");

  return (
    <section className="owkin-whats-new" aria-labelledby="platform-highlights-heading">
      <div className={container}>
        <ScrollReveal>
          <h2 id="platform-highlights-heading" className="owkin-whats-new__title">
            Platform highlights
          </h2>
        </ScrollReveal>

        <ScrollReveal delayMs={80}>
          <div className="owkin-whats-new__tabs" role="tablist" aria-label="Platform highlight categories">
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
