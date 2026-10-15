import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { PageHead, SectionTitle, SubNav } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";
import { DiabetesAreas } from "@/components/site/DiabetesAreas";
import { HUMAN_GATES } from "@/components/site/vision";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How Aksh works beside your records system: what it reads, what it prepares for your team, who decides, and what is recorded.",
};

const FLOW: { title: string; items: string[]; you?: boolean }[] = [
  {
    title: "Comes in",
    items: [
      "Freed slots and bookings from your scheduling system (FHIR R4 or JSON)",
      "Your patient list, from a CSV export",
      "CGM exports and device readings",
      "Readings patients choose to share",
    ],
  },
  {
    title: "Aksh prepares",
    items: [
      "Waiting-list patients who fit a freed slot, ranked, with reasons",
      "CGM metrics and a worklist, low glucose first",
      "Flags for missing, stale or unverified data",
      "Drafts for clinical review (in development)",
    ],
  },
  {
    title: "Your team decides",
    you: true,
    items: ["Offer, skip or defer, with a reason", "Accept a patient upload or send it back", "Accept, edit or reject any draft", "Hand anything to a named person"],
  },
  {
    title: "It is recorded",
    items: [
      "Who acted, in which organisation, and when",
      "History the database will not let anyone edit",
      "Bookings counted only when your schedule confirms them",
      "A weekly review your clinic signs off",
    ],
  },
];

const CONTROLS = [
  "Access is decided in the database: each clinic sees only its own patients, whatever the screen shows.",
  "No patient data is sent to an AI model in production. Ranking and metrics are rules you can read.",
  "Aksh writes nothing to your records system until a separately approved go-live.",
  "Every action is attributed and kept in history that cannot be edited or deleted.",
  "Testing uses a separate environment with fictional patients; it cannot touch real data.",
];

export default function PlatformPage() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="How it works"
        title="Aksh works beside your records system, not instead of it."
        lede="It reads from the systems you already use, prepares worklists and drafts for your team, and records every decision. People make every clinical and patient-facing call."
        glance={{
          title: "At a glance",
          rows: [
            ["Runs beside", "Your EHR and scheduling system"],
            ["Reads", "FHIR R4, CSV exports, CGM files, device feeds"],
            ["Writes back", "Nothing, until an approved go-live"],
            ["Decides", "Your staff, every time"],
            ["AI on patient data", "None in production"],
          ],
        }}
      />
      <SubNav items={[["#flow", "Data flow"], ["#diabetes", "Aksh Diabetes"], ["#controls", "Controls"], ["#go-live", "Going live"]]} />

      <section className="s-section" id="flow" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <SectionTitle n="01" title="What happens to your data" lede="Four steps, the same for every workflow. The third is always a person." />
          <div className="s-flow">
            {FLOW.map((f) => (
              <div key={f.title} className={f.you ? "s-flow--you" : undefined}>
                <h3 className="s-h3" style={{ fontSize: 18 }}>{f.title}</h3>
                <ul>{f.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="diabetes" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <SectionTitle
            n="02"
            eyebrow="Aksh Diabetes"
            title="What a diabetes care team gets"
            lede="Glucose monitoring is available today. The rest of the module adds to the same worklist, with the reasoning shown and a clinician deciding."
          />
          <DiabetesAreas />
        </div>
      </section>

      <section className="s-section" id="controls" style={{ scrollMarginTop: 130 }}>
        <div className="s-container s-split">
          <div>
            <SectionTitle n="03" title="Controls that do not depend on the screen" />
            <p className="s-body">These are enforced on the server and in the database. A role that may not take an action cannot, whatever the interface shows.</p>
            <Link href="/security" className="s-link">Security in detail →</Link>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <ul className="s-check" style={{ background: "var(--s-raised)", border: "1px solid var(--s-line)", borderRadius: 20, padding: 24 }}>
              {CONTROLS.map((c) => <li key={c}><Check aria-hidden />{c}</li>)}
            </ul>
            <div className="s-spec" aria-label="Decisions that always need a named person">
              {HUMAN_GATES.map((g) => (
                <div key={g.gate} style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)" }}>
                  <b>{g.gate}</b>
                  <span>{g.who}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="go-live" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <SectionTitle n="04" title="Going live" lede="A clinic sets up in the product, shows its evidence, and starts in shadow mode. Each stage is reviewed and recorded." />
          <ol className="s-steps">
            <li className="s-step"><span className="s-step__n">1</span><h3 className="s-h3">Set up</h3><p className="s-small">Invite staff, load patients and the waiting list, connect your schedule.</p></li>
            <li className="s-step"><span className="s-step__n">2</span><h3 className="s-h3">Show evidence</h3><p className="s-small">Data processing agreement, privacy assessment, clinical safety lead, contact channel and a locked baseline.</p></li>
            <li className="s-step"><span className="s-step__n">3</span><h3 className="s-h3">Aksh review</h3><p className="s-small">Each item is checked; anything missing comes back with a reason.</p></li>
            <li className="s-step"><span className="s-step__n">4</span><h3 className="s-h3">Shadow mode</h3><p className="s-small">Staff make every contact through their own channels. Widen only when the weekly reviews support it.</p></li>
          </ol>
          <p style={{ marginTop: 20 }}><Link href="/resources/going-live" className="s-link">The go-live guide →</Link></p>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">Start with one workflow.</h2>
              <p>Most clinics start with cancelled-slot fill in shadow mode. We will walk through your process and what go-live involves.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
              <Link href="/product" className="s-btn s-btn--ghost">What is available</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
