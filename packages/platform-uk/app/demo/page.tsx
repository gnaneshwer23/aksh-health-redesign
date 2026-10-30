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
    "Synthetic guided walkthroughs of Aksh production workflows and connected diabetes intelligence. Staff and clinicians always decide.",
};

export default function DemoCatalogPage() {
  const connected = PUBLIC_DEMOS.find((d) => d.id === "connected-diabetes");

  return (
    <SiteShell>
      <PageHero
        title="Explore a demo."
        lede="Walk production workflows and the connected diabetes intelligence journey with synthetic data. You decide every offer and every clinical response."
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

      {connected ? (
        <section className="s-section s-section--soft">
          <div className="s-container">
            <div className="s-head" style={{ marginBottom: 20 }}>
              <span className="s-eyebrow">Synthetic clinical intelligence</span>
              <h2 className="s-h3" style={{ fontSize: 22 }}>Connected diabetes journey</h2>
              <p className="s-lede">
                Flagship Phases 0–5 path. Status remains synthetic_demo · LIVE organisations: 0.
              </p>
            </div>
            <div className="wd-catalog">
              <Link href={connected.href} className="wd-card" data-demo-card={connected.id}>
                <div className="s-row" style={{ justifyContent: "flex-start", gap: 10 }}>
                  <StatusPill s={capability("diabetes_care_journey").status} />
                  <span className="s-small">{connected.duration}</span>
                </div>
                <h3>{connected.title}</h3>
                <p>{connected.description}</p>
                <span className="s-link">Open guided demo →</span>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="s-section s-section--tight">
        <div className="s-container">
          <div className="s-head" style={{ marginBottom: 20 }}>
            <span className="s-eyebrow">More walkthroughs</span>
            <h2 className="s-h3" style={{ fontSize: 22 }}>Clinical spine and role demos</h2>
          </div>
          <div className="wd-catalog">
            {PUBLIC_DEMOS.filter(
              (d) => d.id !== "slot-fill" && d.id !== "glucose" && d.id !== "connected-diabetes"
            ).map((d) => (
              <Link key={d.id} href={d.href} className="wd-card">
                <span className="s-small">
                  {d.category} · {d.duration}
                </span>
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
