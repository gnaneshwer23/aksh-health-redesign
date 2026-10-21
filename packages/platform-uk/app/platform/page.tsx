import type { Metadata } from "next";
import Link from "next/link";

import { Chip, Cluster, RangeStack, Tile, Timeline, Worklist } from "@/components/site/canvas/tiles";
import { PageHero } from "@/components/site/PageHero";
import { PilotCta } from "@/components/site/PageParts";
import { Pillars } from "@/components/site/Pillars";
import { HUMAN_GATES, NON_OBJECTIVES } from "@/components/site/vision";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Where Aksh sits beside your records and scheduling systems, and what happens step by step when an appointment frees up or glucose data arrives.",
};

const SOURCES = [
  { name: "Scheduling system", detail: "Freed slots and bookings" },
  { name: "Records system", detail: "Your patient list" },
  { name: "CGM devices", detail: "Uploads or a device feed" },
  { name: "Patient app", detail: "Readings patients share" },
];

const SLOT_STEPS: { title: string; body: string; you?: boolean }[] = [
  { title: "An appointment frees up", body: "Your scheduling system reports the cancellation, or a member of staff records it." },
  { title: "Aksh finds who fits", body: "Every patient waiting for that appointment type is checked against the slot and your clinic’s rules, then ranked, with the reason shown for each." },
  { title: "Your staff choose and contact", body: "Staff pick the patient, approve the message from your wording, and contact them through the channel you already use.", you: true },
  { title: "Your schedule confirms the booking", body: "The slot counts as filled only when your schedule shows the booking for that patient. Anything uncertain goes to a person with a due time." },
  { title: "You see the result every week", body: "Fill rate, staff time and issues, against the baseline your clinic set before going live." },
];

const CGM_STEPS: { title: string; body: string; you?: boolean }[] = [
  { title: "Glucose data arrives", body: "A clinic upload, a device feed, or a patient’s own upload from the app." },
  { title: "Aksh calculates the standard measures", body: "Time in range, time low and high, variability and the daily pattern, over the last 14 days, with a warning when data is too thin." },
  { title: "The worklist puts low glucose first", body: "Patients are ordered by urgency, so the people who need attention are at the top." },
  { title: "A clinician reviews and decides", body: "Patient uploads count only after a clinician reviews them. Aksh does not contact the patient or change treatment.", you: true },
];

function Steps({ steps }: { steps: { title: string; body: string; you?: boolean }[] }) {
  return (
    <ol className="s-walk__steps">
      {steps.map((s) => (
        <li key={s.title} className={s.you ? "s-walk--you" : undefined}>
          <span><b>{s.title}</b><p>{s.body}</p></span>
        </li>
      ))}
    </ol>
  );
}

export default function PlatformPage() {
  return (
    <SiteShell>
      <PageHero title="Aksh works beside your systems, and your team decides." lede="It reads what your clinic already records, prepares the work, and keeps a record of every decision. It does not replace your records system and does not act on its own." />

      <section className="s-section s-section--tight" id="where" aria-labelledby="where-title">
        <div className="s-container">
          <h2 id="where-title" className="s-h3" style={{ fontSize: 22, marginBottom: 20 }}>Where Aksh sits</h2>
          <div className="s-map" data-system-map>
            <div className="s-map__col">
              <span className="s-map__title">Your systems</span>
              {SOURCES.map((x) => <div key={x.name} className="s-map__node"><b>{x.name}</b>{x.detail}</div>)}
            </div>
            <div className="s-map__arrow" aria-hidden><span>reads</span></div>
            <div className="s-map__col">
              <span className="s-map__title">Aksh</span>
              <div className="s-map__core">
                <b>Prepares the work</b>
                <ul>
                  <li>Matches patients to freed slots</li>
                  <li>Calculates glucose measures</li>
                  <li>Checks against your rules</li>
                  <li>Flags missing or unverified data</li>
                </ul>
              </div>
            </div>
            <div className="s-map__arrow" aria-hidden><span>worklist</span></div>
            <div className="s-map__col">
              <span className="s-map__title">Your team</span>
              <div className="s-map__node s-map__you"><b>Decides</b>Who to offer, what to send, what a reading means</div>
              <div className="s-map__node"><b>Acts</b>Through your own phone, messaging and schedule</div>
            </div>
            <div className="s-map__arrow" aria-hidden><span>recorded</span></div>
            <div className="s-map__col">
              <span className="s-map__title">The record</span>
              <div className="s-map__node"><b>History</b>Who decided what, and when. It cannot be edited.</div>
              <div className="s-map__node"><b>Weekly results</b>Against your own baseline</div>
            </div>
          </div>
          <p className="s-map-note">
            <span>Reads only: nothing is written to your records system</span>
            <span>No patient data is sent to AI models</span>
            <span>Each clinic sees only its own patients</span>
          </p>
        </div>
      </section>

      <section className="s-section s-section--soft" id="slot-fill">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Example one</span>
            <h2 className="s-h2">A freed appointment, start to finish</h2>
          </div>
          <div className="s-walk">
            <Steps steps={SLOT_STEPS} />
            <Cluster cols={1}>
              <Tile title="Slot history · Thu 09:40" aside={<Chip tone="amber">Shadow mode</Chip>}>
                <Timeline
                  steps={[
                    { t: "Slot received from your schedule", d: "Diabetes review, 20 minutes", state: "done" },
                    { t: "3 patients ranked, 1 not eligible", d: "Overdue care first, reasons shown for each", state: "done" },
                    { t: "Offer approved by staff", d: "Sent through your own channel, not by Aksh", state: "done" },
                    { t: "Patient accepted", d: "Waiting for the schedule to show the booking", state: "done" },
                    { t: "Booking confirmed by the schedule", d: "Counted as filled", state: "now" },
                  ]}
                />
              </Tile>
              <Tile title="If the schedule does not show the booking" aside={<Chip tone="red">Hand-off</Chip>}>
                <p className="c-text">Aksh never counts it as filled. A hand-off goes to your reception queue with a reason and a due time.</p>
              </Tile>
            </Cluster>
          </div>
        </div>
      </section>

      <section className="s-section" id="glucose">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Example two</span>
            <h2 className="s-h2">Glucose between visits</h2>
          </div>
          <div className="s-walk">
            <Steps steps={CGM_STEPS} />
            <Cluster cols={1}>
              <Tile title="Worklist · low glucose first">
                <Worklist
                  rows={[
                    { dot: "red", name: "A. Mensah", detail: "2% below 3.0 mmol/L", chip: <Chip tone="red">Urgent</Chip> },
                    { dot: "amber", name: "S. Novak", detail: "Time in range 61%", chip: <Chip tone="amber">Review</Chip> },
                    { dot: "grey", name: "P. Silva", detail: "9 days of data, not enough yet", chip: <Chip>Data</Chip> },
                  ]}
                />
              </Tile>
              <Tile title="Time in ranges · A. Mensah">
                <RangeStack parts={[{ label: "Very high", pct: 12, tone: "vhigh" }, { label: "High", pct: 32, tone: "high" }, { label: "In range", pct: 48, tone: "in" }, { label: "Low", pct: 6, tone: "low" }, { label: "Very low", pct: 2, tone: "vlow" }]} />
              </Tile>
            </Cluster>
          </div>
        </div>
      </section>

      <section className="s-section" id="capabilities">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Capabilities</span>
            <h2 className="s-h2">Everything Aksh does, and where each part is today</h2>
            <p className="s-lede">Patient access and clinical review share sign-in, consent, connections and audit. Only what is marked Production is available to clinics.</p>
          </div>
          <Pillars />
        </div>
      </section>

      <section className="s-section s-dark" id="control">
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Control</span>
            <h2 className="s-h2">What Aksh will not do</h2>
            <p className="s-body">Aksh prepares options and drafts. Choosing a patient, contacting them and anything clinical stays with your staff, and some decisions always need a named person.</p>
            <ol className="s-gates">
              {HUMAN_GATES.map((g, i) => (
                <li key={g.gate} className="s-gate"><b>{i + 1}</b><span><strong>{g.gate}</strong>{g.who}</span></li>
              ))}
            </ol>
            <Link href="/security" className="s-btn s-btn--ghost" style={{ justifySelf: "start" }}>Security and clinical safety</Link>
          </div>
          <ul className="s-limits">
            {NON_OBJECTIVES.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </section>

      <section className="s-section" id="start">
        <div className="s-container s-feature" style={{ alignItems: "start" }}>
          <div className="s-feature__copy">
            <span className="s-eyebrow">Getting started</span>
            <h2 className="s-h2">What you need to start</h2>
            <p className="s-body">Most clinics start with cancelled-slot fill and add glucose monitoring when they are ready. Every clinic starts in shadow mode: staff make every contact, and Aksh keeps the record.</p>
            <Link href="/resources/going-live" className="s-link">What going live involves →</Link>
          </div>
          <div className="s-spec">
            {[
              ["Your patient list", "A CSV export from your records system"],
              ["A waiting list", "Patients who want an earlier appointment, with the reason"],
              ["Freed slots", "Recorded by staff, or sent by your scheduling system"],
              ["Glucose data (optional)", "CGM exports or a device feed"],
              ["Before going live", "A data processing agreement, a privacy assessment and a named clinical lead"],
            ].map(([k, v]) => (
              <div key={k} style={{ gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.4fr)" }}><b>{k}</b><span>{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      <PilotCta secondary={{ href: "/product", label: "What’s available now" }} />
    </SiteShell>
  );
}
