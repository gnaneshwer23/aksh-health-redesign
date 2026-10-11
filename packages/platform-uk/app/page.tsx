import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CalendarClock, Check, ClipboardCheck, FileDown, KeyRound, LineChart, Lock, ScrollText, ShieldCheck, Smartphone, UserCheck } from "lucide-react";

import { CgmMock, PatientMock, ReviewMock, SlotFillMock, WorkflowMock } from "@/components/site/Mockups";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Aksh Health | Diabetes care operations for clinics",
  description:
    "Aksh fills cancelled diabetes appointments with the patients who need them most, monitors glucose between visits, and measures the change against your own baseline. Your staff stay in control of every contact.",
};

function Checks({ items }: { items: string[] }) {
  return (
    <ul className="s-check">
      {items.map((i) => (
        <li key={i}><Check aria-hidden />{i}</li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <SiteShell>
      <section className="s-hero">
        <div className="s-container s-hero__grid">
          <div className="s-hero__copy">
            <span className="s-eyebrow">Diabetes care operations</span>
            <h1 className="s-h1">Every cancelled appointment, offered to the patient who needs it most.</h1>
            <p className="s-lede">
              Aksh matches freed diabetes appointments to your waiting list by clinical need, drafts the offer, and follows
              the booking until it shows in your schedule. Your staff decide and make every contact.
            </p>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
              <Link href="/product" className="s-btn s-btn--ghost">See the product</Link>
            </div>
            <p className="s-hero__note">Starts in shadow mode: Aksh never messages patients or books on its own.</p>
          </div>
          <SlotFillMock />
        </div>
      </section>

      <div className="s-container">
        <div className="s-facts">
          <div className="s-fact"><b>Staff decide</b><span>Every offer is approved and sent by your team</span></div>
          <div className="s-fact"><b>Verified bookings</b><span>Counted only when your schedule shows them</span></div>
          <div className="s-fact"><b>Your own baseline</b><span>Results measured against your numbers before Aksh</span></div>
          <div className="s-fact"><b>Organisation-isolated</b><span>Each clinic sees only its own records</span></div>
        </div>
      </div>

      <section className="s-section">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">The product</span>
            <h2 className="s-h2">One workspace for the work between appointments.</h2>
            <p className="s-lede">Built for diabetes teams: clinicians, nurses, pharmacists and practice managers, with an app for patients.</p>
          </div>

          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-icon"><CalendarClock /></span>
              <h3 className="s-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)" }}>Fill cancelled slots, fairly and fast.</h3>
              <p className="s-body">
                When an appointment frees up, Aksh checks your waiting list against the slot and your rules, then ranks who
                fits, with the reasons on screen. Patients without a contact preference, inside their notice period or
                already holding an offer are listed, not silently dropped.
              </p>
              <Checks items={["Ranking order and offer limits set by your clinic", "Offer text from an approved template, no clinical detail", "A booking counts only after read-back from your schedule"]} />
              <Link href="/product#slot-fill" className="s-link">How slot fill works →</Link>
            </div>
            <WorkflowMock />
          </div>

          <div className="s-feature s-feature--flip">
            <div className="s-feature__copy">
              <span className="s-icon"><Activity /></span>
              <h3 className="s-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)" }}>See who needs attention between visits.</h3>
              <p className="s-body">
                CGM data and patient-shared readings in one worklist, ranked by urgency: low glucose first, then high
                glucose, then gaps in data. Metrics follow the international consensus on time in range.
              </p>
              <Checks items={["Time in range, below and above range, GMI and variability", "Patient uploads count only after a clinician reviews them", "Dexcom Clarity, LibreView and generic exports, or a device feed"]} />
              <Link href="/product#monitoring" className="s-link">How monitoring works →</Link>
            </div>
            <CgmMock />
          </div>

          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-icon"><LineChart /></span>
              <h3 className="s-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)" }}>Know what changed, with the numbers to prove it.</h3>
              <p className="s-body">
                Before go-live you lock a baseline: how many freed slots you filled before Aksh. Every week after, the review
                shows your fill rate with its counts and range, what staff decided, and what needs a conversation.
              </p>
              <Checks items={["One published definition of a filled slot", "Weekly sign-off, frozen and auditable", "No comparison claimed until there are enough slots"]} />
              <Link href="/product#results" className="s-link">How results are measured →</Link>
            </div>
            <ReviewMock />
          </div>

          <div className="s-feature s-feature--flip">
            <div className="s-feature__copy">
              <span className="s-icon"><Smartphone /></span>
              <h3 className="s-h2" style={{ fontSize: "clamp(26px, 2.6vw, 34px)" }}>An app your patients can actually use.</h3>
              <p className="s-body">
                Patients link to your clinic with a code you give them, record glucose, blood pressure and weight, upload CGM
                exports, and choose what to share. They can download everything you hold about them.
              </p>
              <Checks items={["Readings reach the care team, flagged for review", "Sharing is the patient’s decision, recorded", "Two-step sign-in available to every account"]} />
              <Link href="/product#patients" className="s-link">About the patient app →</Link>
            </div>
            <PatientMock />
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">How it works</span>
            <h2 className="s-h2">From a freed slot to a verified booking.</h2>
          </div>
          <ol className="s-steps">
            <li className="s-step"><span className="s-step__n">01</span><h3 className="s-h3">A slot frees up</h3><p className="s-small">Your scheduling system reports it through the connector, or staff record it in seconds.</p></li>
            <li className="s-step"><span className="s-step__n">02</span><h3 className="s-h3">Aksh ranks who fits</h3><p className="s-small">Eligibility and ranking follow your rules. Every candidate shows the reasons.</p></li>
            <li className="s-step"><span className="s-step__n">03</span><h3 className="s-h3">Your team makes contact</h3><p className="s-small">Staff approve the drafted offer and send it through your usual channel.</p></li>
            <li className="s-step"><span className="s-step__n">04</span><h3 className="s-h3">The booking is checked</h3><p className="s-small">It counts as filled only when your schedule shows it. If not, a person follows up.</p></li>
          </ol>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Security and governance</span>
            <h2 className="s-h2">Built for clinical data from the first line.</h2>
            <p className="s-lede">The controls your data protection and clinical safety leads will ask about are part of the product, not a roadmap.</p>
          </div>
          <div className="s-grid s-grid--3">
            {[
              { icon: Lock, title: "Isolated by organisation", body: "Database row-level security means each clinic sees only its own patients. Patients see only their own record." },
              { icon: KeyRound, title: "Two-step sign-in", body: "Authenticator-app codes for every account, with single-use recovery codes. Required for Aksh reviewers." },
              { icon: ScrollText, title: "Append-only audit", body: "Every slot action, consent decision and go-live step is recorded with who did it and when. History is never edited." },
              { icon: ClipboardCheck, title: "Go-live checklist", body: "Data processing agreement, privacy impact assessment, a named clinical safety lead and a locked baseline before live use." },
              { icon: UserCheck, title: "People decide", body: "Aksh drafts and ranks. It never contacts patients, books appointments or makes clinical decisions on its own." },
              { icon: FileDown, title: "Your data, exportable", body: "Organisations export everything they hold; patients download their own record, at any time." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="s-card">
                <span className="s-icon"><Icon /></span>
                <h3 className="s-h3">{title}</h3>
                <p className="s-small">{body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32 }}>
            <Link href="/security" className="s-link">Read about security <ShieldCheck size={16} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft">
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Getting started</span>
            <h2 className="s-h2">Live in weeks, one workflow at a time.</h2>
          </div>
          <ol className="s-steps">
            <li className="s-step"><span className="s-step__n">Week 1</span><h3 className="s-h3">Set up</h3><p className="s-small">Create your clinic, invite your team and check clinician registrations.</p></li>
            <li className="s-step"><span className="s-step__n">Week 1–2</span><h3 className="s-h3">Load your list</h3><p className="s-small">Import patients from a spreadsheet and build the waiting list.</p></li>
            <li className="s-step"><span className="s-step__n">Week 2–4</span><h3 className="s-h3">Complete go-live</h3><p className="s-small">Agreements, privacy assessment, safety lead, contact channel and baseline.</p></li>
            <li className="s-step"><span className="s-step__n">Then</span><h3 className="s-h3">Run in shadow mode</h3><p className="s-small">Your team works the queue; you review results every week.</p></li>
          </ol>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">Bring Aksh to your clinic.</h2>
              <p>Tell us about your diabetes service and how cancellations work today. We will set up a call with the right person.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--light">Request access</Link>
              <Link href="/contact" className="s-btn s-btn--outline-light">Contact us</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
