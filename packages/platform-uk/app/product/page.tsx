import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { CgmMock, PatientMock, ReviewMock, SlotFillMock } from "@/components/site/Mockups";
import { PageHead, SubNav } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Available now",
  description:
    "The Aksh workflows in production with clinics today: cancelled-slot fill, CGM monitoring, the patient app and measured results.",
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

export default function ProductPage() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="Available now"
        title="What a clinic can use today."
        lede="Four workflows are in production: filling freed appointments, monitoring glucose between visits, a patient app for sharing readings, and a weekly review of results. Every clinic starts in shadow mode, with staff making every contact."
        glance={{
          title: "At a glance",
          rows: [
            ["Status", "In production, ready for go-live"],
            ["Starts in", "Shadow mode"],
            ["Contacts patients", "Your staff, through your channels"],
            ["Books appointments", "No. Your schedule confirms each booking"],
            ["You provide", "Patient list, schedule feed, CGM files"],
          ],
        }}
      />
      <SubNav items={[["#slot-fill", "Slot fill"], ["#monitoring", "Monitoring"], ["#patients", "Patient app"], ["#results", "Results"], ["#roles", "Roles"], ["#connect", "Connections"]]} />

      <section className="s-section" id="slot-fill" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Cancelled-slot fill</span>
              <h2 className="s-h2">Freed slots matched to your waiting list, with reasons.</h2>
              <p className="s-body">
                A freed appointment arrives from your scheduling system or is recorded by staff. Aksh checks every patient on
                the waiting list for that appointment type against the slot and your clinic’s rules, ranks those who fit, and
                lists the rest with the reason they were not offered.
              </p>
              <Checks
                items={[
                  "Ranking by reason for waiting, in the order your clinic sets: overdue care, patient request, clinician request",
                  "Checks earliest and latest dates, notice period, preferred site, opt-outs and existing offers",
                  "A limit on offers per patient in 30 days, and channels you can switch off",
                  "Staff can skip a patient with a reason, defer, or pass the slot to a person",
                  "Staff send the offer through your own channel; Aksh never contacts patients",
                  "A slot counts as filled only when your schedule shows the booking",
                ]}
              />
            </div>
            <SlotFillMock />
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="monitoring" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Diabetes monitoring</span>
              <h2 className="s-h2">A worklist of who needs attention, not another dashboard.</h2>
              <p className="s-body">
                Continuous glucose data from uploads or a device feed, and readings patients share from the app, come
                together per patient. The worklist puts low glucose first, then high glucose, then missing data.
              </p>
              <Checks
                items={[
                  "Time in range, time below and above range, mean glucose, GMI and coefficient of variation",
                  "Ambulatory glucose profile by hour of the day",
                  "Flags against the general consensus targets; the clinician decides which targets apply",
                  "Data sufficiency shown: 14 days and 70% sensor wear before metrics are treated as reliable",
                  "Patient uploads are reviewed by a clinician before they count",
                ]}
              />
            </div>
            <CgmMock />
          </div>
        </div>
      </section>

      <section className="s-section" id="patients" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature s-feature--flip">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Patient app</span>
              <h2 className="s-h2">Patients share readings when they choose.</h2>
              <p className="s-body">
                Your clinic gives a patient an invite code. They link their account with the code and their date of birth,
                then record readings or upload CGM exports. Readings before linking stay private until the patient chooses to
                share them.
              </p>
              <Checks
                items={[
                  "Glucose, blood pressure and weight, in the units the patient uses",
                  "Readings reach the care team marked as patient-reported until checked",
                  "Download a copy of their own record at any time",
                  "Two-step sign-in with an authenticator app",
                ]}
              />
            </div>
            <PatientMock />
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="results" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Measured results</span>
              <h2 className="s-h2">Results with one definition and a locked baseline.</h2>
              <p className="s-body">
                Fill rate has one definition: slots where the patient accepted before the offer expired and the booking was
                verified before the slot started, divided by slots received. Your baseline is locked before go-live and cannot
                be edited afterwards.
              </p>
              <Checks
                items={[
                  "Rates always shown with their counts and a 95% range",
                  "No comparison until both periods have at least 20 slots",
                  "Weekly review per clinic: funnel, staff decisions, speed, hand-offs and data gaps",
                  "Sign-off freezes the week’s figures; corrections are added, never overwritten",
                ]}
              />
            </div>
            <ReviewMock />
          </div>
        </div>
      </section>

      <section className="s-section" id="roles" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Who uses it</span>
            <h2 className="s-h2">Each role sees only what it needs.</h2>
          </div>
          <div className="s-grid s-grid--3">
            {[
              { t: "Clinicians", b: "Physicians, nurses and pharmacists work the slot queue, review readings and CGM uploads, and see the monitoring worklist." },
              { t: "Practice managers", b: "Work the slot queue and run the organisation: staff, invites, connections, settings, go-live and the weekly review." },
              { t: "Patients", b: "Link to their clinic, record and share readings, upload CGM data and download their record." },
            ].map((r) => (
              <div key={r.t} className="s-card">
                <h3 className="s-h3">{r.t}</h3>
                <p className="s-small">{r.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="connect" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-head">
            <span className="s-eyebrow">Connections</span>
            <h2 className="s-h2">Works beside the systems you already run.</h2>
            <p className="s-lede">Aksh does not replace your records or scheduling system. It reads from them and writes nothing back.</p>
          </div>
          <div className="s-grid s-grid--3">
            <div className="s-card">
              <h3 className="s-h3">Schedule connector</h3>
              <p className="s-small">Your scheduling system reports freed slots and bookings as FHIR R4 Slot and Appointment resources, or plain JSON, with a per-organisation key.</p>
              <Link href="/resources/schedule-connector" className="s-link">Connector guide →</Link>
            </div>
            <div className="s-card">
              <h3 className="s-h3">Glucose data</h3>
              <p className="s-small">CGM exports from Dexcom Clarity, LibreView or a generic CSV, and device readings as FHIR R4 Observations.</p>
              <Link href="/resources/cgm-and-readings" className="s-link">Monitoring guide →</Link>
            </div>
            <div className="s-card">
              <h3 className="s-h3">Patient list</h3>
              <p className="s-small">Import patients from a CSV export of your records system, with a template and row-by-row validation.</p>
              <Link href="/resources/importing-patients" className="s-link">Import guide →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="s-section">
        <div className="s-container">
          <div className="s-cta">
            <div>
              <h2 className="s-h2">See it with your own waiting list.</h2>
              <p>We will walk through your cancellation process and what go-live would involve for your clinic.</p>
            </div>
            <div className="s-actions">
              <Link href="/get-started" className="s-btn s-btn--primary">Request access</Link>
              <Link href="/resources" className="s-btn s-btn--ghost">Read the guides</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
