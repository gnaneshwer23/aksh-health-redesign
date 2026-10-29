import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/PageHero";
import { SiteShell } from "@/components/site/SiteShell";
import { StatusPill } from "@/components/site/StatusPill";
import { PUBLIC_DEMOS } from "@/lib/demo-catalog";
import { WORKFLOW_DEMOS } from "@/lib/workflow-demos";
import { capability } from "@/lib/status/capabilities";

export const metadata: Metadata = {
  title: "Explore a demo",
  description:
    "Synthetic guided walkthroughs of Aksh production workflows: cancelled-slot fill and glucose monitoring. Staff and clinicians always decide.",
};

export default function DemoCatalogPage() {
  return (
    <SiteShell>
      <PageHero
        title="Explore a demo."
        lede="Walk the two production workflows with synthetic data. You decide every offer and every clinical response — Aksh prepares the worklist."
      />

      <section className="s-section s-section--tight">
        <div className="s-container">
          <div className="s-head" style={{ marginBottom: 20 }}>
            <span className="s-eyebrow">Production workflows</span>
            <h2 className="s-h2">Start here</h2>
            <p className="s-lede">Interactive, synthetic only. No live patient data.</p>
          </div>
          <div className="wd-catalog">
            {WORKFLOW_DEMOS.map((d) => {
              const c = capability(d.capabilityId);
              return (
                <Link key={d.id} href={d.href} className="wd-card" data-demo-card={d.id}>
                  <div className="s-row" style={{ justifyContent: "flex-start", gap: 10 }}>
                    <StatusPill s={c.status} />
                    <span className="s-small">{d.duration}</span>
                  </div>
                  <h3>{d.label}</h3>
                  <p>{d.description}</p>
                  <span className="s-link">Open guided demo →</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft">
        <div className="s-container">
          <div className="s-head" style={{ marginBottom: 20 }}>
            <span className="s-eyebrow">More walkthroughs</span>
            <h2 className="s-h3" style={{ fontSize: 22 }}>Clinical spine and role demos</h2>
          </div>
          <div className="wd-catalog">
            {PUBLIC_DEMOS.filter((d) => d.id !== "slot-fill" && d.id !== "glucose").map((d) => (
              <Link key={d.id} href={d.href} className="wd-card">
                <span className="s-small">{d.category} · {d.duration}</span>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
                <span className="s-link">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
