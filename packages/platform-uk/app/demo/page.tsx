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
    "Synthetic guided walkthroughs of Aksh production workflows and the flagship connected diabetes intelligence journey. Staff and clinicians always decide.",
};

export default function DemoCatalogPage() {
  const connected = PUBLIC_DEMOS.find((d) => d.id === "connected-diabetes");

  return (
    <SiteShell>
      <PageHero
        title="Explore a demo."
        lede="Walk production workflows and the connected diabetes intelligence journey with synthetic data. You decide every offer and every clinical response."
      >
        {connected ? (
          <div className="s-actions s-hero2__actions">
            <Link href={connected.href} className="s-btn s-btn--primary" data-demo-cta="connected-diabetes">
              Open connected diabetes demo
            </Link>
            <Link href="#production" className="s-btn s-btn--ghost">
              Production workflows
            </Link>
          </div>
        ) : null}
        <p className="s-small" style={{ margin: 0 }}>
          Synthetic only · LIVE organisations: 0 · no live EHR write-back
        </p>
      </PageHero>

      {connected ? (
        <section className="s-section s-section--tight" id="flagship" style={{ scrollMarginTop: 88 }}>
          <div className="s-container">
            <article className="s-flagship" data-demo-card={connected.id}>
              <div className="s-flagship__copy">
                <div className="s-row" style={{ justifyContent: "flex-start", gap: 10, marginBottom: 12 }}>
                  <span className="s-eyebrow">Flagship</span>
                  <StatusPill s={capability("diabetes_care_journey").status} />
                  <span className="s-small">{connected.duration}</span>
                </div>
                <h2 className="s-h2">{connected.title}</h2>
                <p className="s-lede" style={{ marginTop: 12 }}>
                  {connected.description}
                </p>
                <p className="s-small" style={{ marginTop: 12 }}>
                  Status remains synthetic_demo · not clinically validated · ehrWrite stays false.
                </p>
                <div className="s-actions" style={{ marginTop: 20 }}>
                  <Link href={connected.href} className="s-btn s-btn--primary">
                    Open guided demo
                  </Link>
                  <Link href="/agents" className="s-link">
                    Meet the agents →
                  </Link>
                </div>
              </div>
              <ol className="s-flagship__beats" aria-label="Journey beats">
                {[
                  "Patient 360",
                  "Glucose intelligence",
                  "Medication & care",
                  "Care-plan HITL",
                  "Continuous care",
                  "Agent drafts",
                  "Timeline",
                ].map((beat, i) => (
                  <li key={beat}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    {beat}
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>
      ) : null}

      <section className="s-section s-section--soft" id="production" style={{ scrollMarginTop: 88 }}>
        <div className="s-container">
          <div className="s-head" style={{ marginBottom: 20 }}>
            <span className="s-eyebrow">Production workflows</span>
            <h2 className="s-h2">What clinics can run today</h2>
            <p className="s-lede">Interactive, synthetic only. No live patient data. Staff always choose.</p>
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

      <section className="s-section s-section--tight">
        <div className="s-container">
          <div className="s-head" style={{ marginBottom: 20 }}>
            <span className="s-eyebrow">More walkthroughs</span>
            <h2 className="s-h3" style={{ fontSize: 22 }}>
              Clinical spine and role demos
            </h2>
            <p className="s-lede">Some routes stay gated outside simulation. Honesty banners remain on each surface.</p>
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
