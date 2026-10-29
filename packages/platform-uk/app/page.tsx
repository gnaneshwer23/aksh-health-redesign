import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CalendarClock, Check } from "lucide-react";

import { ProductCanvas } from "@/components/site/canvas/ProductCanvas";
import { DiabetesHistoryPreview } from "@/components/site/DiabetesHistoryPreview";
import { PageHero } from "@/components/site/PageHero";
import { SiteShell } from "@/components/site/SiteShell";
import { PilotCta } from "@/components/site/PageParts";
import { StatusPill } from "@/components/site/StatusPill";
import { HUMAN_GATES } from "@/components/site/vision";
import { capability, type CapabilityId } from "@/lib/status/capabilities";

export const metadata: Metadata = {
  title: "Aksh Health | Diabetes reviews, better coordinated",
  description:
    "Aksh helps diabetes care teams fill cancelled appointments from the waiting list and see whose glucose needs attention first. Staff decide every step; results are measured against your own baseline.",
};

/** The workflows a clinic can use today. Each one: how it works, what staff do, what the clinic measures. */
const WORKFLOWS: {
  id: CapabilityId;
  anchor: string;
  icon: typeof CalendarClock;
  title: string;
  value: string;
  how: string;
  staff: string;
  measure: string;
  guide: string;
  mock: "slot" | "cgm";
}[] = [
  {
    id: "slot_fill",
    anchor: "slot-fill",
    icon: CalendarClock,
    title: "Fill cancelled appointments",
    value: "When an appointment is freed, Aksh ranks the patients on your waiting list who fit it, with the reasons, and says why the others were not offered.",
    how: "Freed slots arrive from your schedule or are recorded by staff. Aksh checks the waiting list against dates, notice, site and opt-outs, and ranks by the reasons for waiting in the order your clinic sets.",
    staff: "Staff choose who to offer it to and send the offer through your own channel; Aksh never contacts patients. Anything unusual goes to a named person with a due time.",
    measure: "A slot counts as filled only when your schedule shows the booking. Fill rate and staff minutes per slot, weekly.",
    guide: "/resources/slot-fill",
    mock: "slot",
  },
  {
    id: "cgm_monitoring",
    anchor: "monitoring",
    icon: Activity,
    title: "See whose glucose needs attention first",
    value: "CGM data and readings shared from the patient app become one worklist, with low glucose at the top.",
    how: "Aksh calculates time in range, time below and above range, variability and the daily pattern from CGM uploads or a device feed, flagged against the general consensus targets.",
    staff: "A clinician works down the list (low glucose first, then high, then missing data), decides which targets apply and decides the response.",
    measure: "Whose data is sufficient (14 days, 70% sensor wear) and who has been reviewed. Patient uploads count only after a clinician checks them.",
    guide: "/resources/cgm-and-readings",
    mock: "cgm",
  },
];

const PROBLEMS = [
  { t: "Cancelled slots go unused", b: "A review is cancelled at short notice and the slot is lost, while patients who need it wait weeks." },
  { t: "Glucose data without a worklist", b: "CGM and home readings arrive, but nobody can see quickly who needs attention first." },
  { t: "Work that is hard to evidence", b: "Hand-offs get lost between staff, and it is difficult to show what changed after a new process." },
];

export default function HomePage() {
  return (
    <SiteShell>
      <PageHero
        title={<>Diabetes reviews, <span className="s-grad">better coordinated.</span></>}
        lede="Aksh helps your team fill cancelled appointments from the waiting list and see whose glucose needs attention first. Your staff decide every step, and results are measured against your own baseline."
        module="today"
      >
        <div className="s-actions s-hero2__actions">
          <Link href="/get-started" className="s-btn s-btn--primary">Request an organisational pilot</Link>
          <Link href="/demo" className="s-btn s-btn--ghost">Explore a demo</Link>
        </div>
        <p className="s-hero-panel__note s-hero2__pills" aria-label="In production today">
          {(["slot_fill", "cgm_monitoring", "patient_readings"] as CapabilityId[]).map((id) => <span key={id}>{capability(id).name}</span>)}
        </p>
      </PageHero>

      <section className="s-section" id="problem">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">The problem</span>
            <h2 className="s-h2">Three things that slow diabetes care down.</h2>
          </div>
          <div className="s-grid s-grid--3">
            {PROBLEMS.map((p) => (
              <div key={p.t} className="s-card">
                <h3 className="s-h3">{p.t}</h3>
                <p className="s-small">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="available-now">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Available now</span>
            <h2 className="s-h2">Two workflows a clinic can start with today.</h2>
            <p className="s-lede">Both are in production. Each starts in shadow mode alongside your current process, so you can compare before you rely on it.</p>
          </div>
          <div style={{ display: "grid", gap: 56 }}>
            {WORKFLOWS.map((w, i) => {
              const Icon = w.icon;
              const c = capability(w.id);
              return (
                <article key={w.id} id={w.anchor} className="s-workflow" data-workflow={w.id} data-status={c.status} style={{ scrollMarginTop: 80 }}>
                  <div className="s-workflow__head">
                    <div>
                      <div className="s-row" style={{ justifyContent: "flex-start", gap: 12, marginBottom: 12 }}>
                        <span className="s-icon"><Icon /></span>
                        <StatusPill s={c.status} />
                      </div>
                      <h3 className="s-h2" style={{ fontSize: "clamp(26px, 3vw, 36px)" }}>{w.title}</h3>
                    </div>
                    <div>
                      <p className="s-body" style={{ margin: 0 }}>{w.value}</p>
                      <div className="s-actions" style={{ marginTop: 12 }}>
                        <Link href={w.id === "slot_fill" ? "/demo/slot-fill" : "/demo/glucose"} className="s-link">
                          Try the guided demo →
                        </Link>
                        <Link href={`/product#${w.anchor}`} className="s-link">How {w.id === "slot_fill" ? "slot filling" : "glucose monitoring"} works →</Link>
                        <Link href={w.guide} className="s-link">Setup guide →</Link>
                      </div>
                    </div>
                  </div>
                  <ProductCanvas module={w.mock === "slot" ? "slots" : "glucose"} />
                  <dl className="s-flow3">
                    <div><dt>How it works</dt><dd>{w.how}</dd></div>
                    <div><dt>What staff do</dt><dd>{w.staff}</dd></div>
                    <div><dt>What you measure</dt><dd>{w.measure}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
          <p className="s-small" style={{ marginTop: 32 }}>
            Both come with the patient app for shared readings, hand-offs with an owner and due time, and weekly results.
            {" "}<Link href="/product" className="s-link">What each workflow includes →</Link>
          </p>
        </div>
      </section>

      <DiabetesHistoryPreview />

      <section className="s-section" id="pilot">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">How a pilot runs</span>
            <h2 className="s-h2">One workflow, one baseline, then widen on evidence.</h2>
          </div>
          <ol className="s-steps">
            <li className="s-step"><span className="s-step__n">01</span><h3 className="s-h3">Scope one workflow</h3><p className="s-small">Choose slot filling or glucose monitoring, name the reviewers and agree the boundaries.</p></li>
            <li className="s-step"><span className="s-step__n">02</span><h3 className="s-h3">Set up your clinic</h3><p className="s-small">Invite your team, load patients and the waiting list, connect your schedule or CGM data.</p></li>
            <li className="s-step"><span className="s-step__n">03</span><h3 className="s-h3">Lock the baseline</h3><p className="s-small">Data processing agreement, privacy assessment, a clinical safety lead, and your current numbers recorded.</p></li>
            <li className="s-step"><span className="s-step__n">04</span><h3 className="s-h3">Run in shadow, then live</h3><p className="s-small">Compare with your current process each week. Go live and add workflows only when the results support it.</p></li>
          </ol>
        </div>
      </section>

      <section className="s-section s-dark">
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Clinician control</span>
            <h2 className="s-h2">Aksh prepares the work. A named person decides.</h2>
            <ul className="s-check">
              <li><Check aria-hidden />Every proposal comes with its reasons.</li>
              <li><Check aria-hidden />Decisions are recorded under the signed-in account, in an audit record that cannot be edited.</li>
              <li><Check aria-hidden />Missing information is shown as missing, never guessed.</li>
              <li><Check aria-hidden />No patient data is sent to AI models in production.</li>
            </ul>
            <Link href="/security" className="s-btn s-btn--ghost" style={{ justifySelf: "start" }}>Security and clinical safety</Link>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <p className="s-small">Decisions that always need a named person</p>
            <ol className="s-gates">
              {HUMAN_GATES.map((g, i) => (
                <li key={g.gate} className="s-gate"><b>{i + 1}</b><span><strong>{g.gate}</strong>{g.who}</span></li>
              ))}
            </ol>
            <p className="s-small">Enforced on the server, not only in the interface.</p>
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="diabetes" style={{ scrollMarginTop: 80 }}>
        <div className="s-container">
          <div className="s-row" style={{ alignItems: "end", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div style={{ maxWidth: 760 }}>
              <h2 className="s-h2">Clinical AI, <span style={{ whiteSpace: "nowrap" }}>under clinical control.</span></h2>
              <p className="s-lede" style={{ marginTop: 16 }}>
                Next for Aksh Diabetes: fourteen specialised agents that draft notes and codes, check medicines, read
                laboratory trends, explain risk and prepare referrals, all stopping at a named clinician. In validation on
                synthetic patients; not used for real patients until each agent meets its release criteria.
              </p>
            </div>
            <span style={{ display: "inline-flex", gap: 12, alignItems: "center" }}>
              <StatusPill s="in_validation" />
              <Link href="/agents" className="s-btn s-btn--ghost">Meet the agents</Link>
            </span>
          </div>
          <ProductCanvas module="agents" />
          <p className="s-small" style={{ marginTop: 16 }}>
            <Link href="/platform#capabilities" className="s-link">Every capability and its status →</Link>
          </p>
        </div>
      </section>

      <PilotCta secondary={{ href: "/contact", label: "Contact us" }} />
    </SiteShell>
  );
}
