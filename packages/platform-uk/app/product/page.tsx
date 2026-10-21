import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { AgpChart, Bars, Big, Chip, Cluster, Stats, Tile, Worklist } from "@/components/site/canvas/tiles";
import { PageHero } from "@/components/site/PageHero";
import { PilotCta, SubNav } from "@/components/site/PageParts";
import { SiteShell } from "@/components/site/SiteShell";

export const metadata: Metadata = {
  title: "Available now",
  description:
    "What is included in the Aksh workflows in production: cancelled-slot fill and glucose monitoring, with the patient app and weekly results that support them.",
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
      <PageHero
        title="What a clinic can use today."
        lede="Two workflows are in production, cancelled-slot fill and glucose monitoring, supported by the patient app and weekly results. This page lists what each includes; How it works shows them step by step."
        module="record"
      >
        <dl className="s-facts-inline">
          <div><dt>Starts in</dt><dd>Shadow mode</dd></div>
          <div><dt>Contacts patients</dt><dd>Your staff, your channels</dd></div>
          <div><dt>Books appointments</dt><dd>No, your schedule confirms</dd></div>
          <div><dt>You provide</dt><dd>Patient list, schedule feed, CGM files</dd></div>
        </dl>
      </PageHero>
      <SubNav items={[["#slot-fill", "Slot fill"], ["#monitoring", "Monitoring"], ["#patients", "Patient app"], ["#results", "Results"], ["#roles", "Roles"], ["#connect", "Connections"]]} />

      <section className="s-section" id="slot-fill" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Cancelled-slot fill</span>
              <h2 className="s-h2">Freed slots matched to your waiting list, with reasons.</h2>
              <p className="s-body">What the matching checks, what staff can do, and how a fill is counted.</p>
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
              <Link href="/platform#slot-fill" className="s-link">Step by step →</Link>
            </div>
            <Cluster cols={1}>
              <Tile title="Diabetes review · Thu 09:40" aside={<Chip tone="amber">Shadow mode</Chip>}>
                <Worklist
                  rows={[
                    { dot: "lime", name: "1 · R. Okafor", detail: "Overdue care · waiting since 12 Aug", chip: <Chip tone="lime">Eligible</Chip> },
                    { dot: "lime", name: "2 · M. Haddad", detail: "Patient asked · waiting since 3 Sep", chip: <Chip tone="lime">Eligible</Chip> },
                    { dot: "grey", name: "J. Lindqvist", detail: "Needs 24 h notice", chip: <Chip>Not offered</Chip> },
                  ]}
                />
                <div className="c-actions" aria-hidden><span className="is-primary">Draft offer</span><span>Skip with reason</span><span>Hand off</span></div>
              </Tile>
            </Cluster>
          </div>
        </div>
      </section>

      <section className="s-section s-section--soft" id="monitoring" style={{ scrollMarginTop: 130 }}>
        <div className="s-container">
          <div className="s-feature">
            <div className="s-feature__copy">
              <span className="s-eyebrow">Diabetes monitoring</span>
              <h2 className="s-h2">A worklist of who needs attention, not another dashboard.</h2>
              <p className="s-body">What the worklist calculates and when the numbers can be relied on.</p>
              <Checks
                items={[
                  "Time in range, time below and above range, mean glucose, GMI and coefficient of variation",
                  "Ambulatory glucose profile by hour of the day",
                  "Flags against the general consensus targets; the clinician decides which targets apply",
                  "Data sufficiency shown: 14 days and 70% sensor wear before metrics are treated as reliable",
                  "Patient uploads are reviewed by a clinician before they count",
                ]}
              />
              <Link href="/platform#glucose" className="s-link">Step by step →</Link>
            </div>
            <Cluster cols={1}>
              <Tile title="A. Mensah · 14 days" aside={<Chip tone="teal">94% sensor wear</Chip>}>
                <AgpChart height={200} />
                <Stats items={[{ value: "9.8", label: "Mean mmol/L" }, { value: "7.9%", label: "GMI" }, { value: "41%", label: "CV" }, { value: "48%", label: "In range" }]} />
              </Tile>
            </Cluster>
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
            <Cluster cols={1}>
              <Tile title="Shared from the patient app" aside={<Chip tone="amber">Patient-reported</Chip>}>
                <Worklist
                  rows={[
                    { dot: "amber", name: "Glucose 4.1 mmol/L", detail: "Before breakfast · today 07:42", chip: <Chip>Not yet checked</Chip> },
                    { dot: "amber", name: "Blood pressure 138/84", detail: "Home monitor · yesterday", chip: <Chip>Not yet checked</Chip> },
                    { dot: "teal", name: "Weight 82.4 kg", detail: "Checked by nurse · Monday", chip: <Chip tone="teal">Confirmed</Chip> },
                  ]}
                />
              </Tile>
            </Cluster>
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
            <Cluster cols={2}>
              <Tile title="Fill rate">
                <Big value="68" unit="%" label="16 of 24 slots · 95% range 47–84%" />
                <Bars values={[38, 44, 52, 49, 61, 68]} labels={["W1", "W2", "W3", "W4", "W5", "W6"]} highlight={5} height={110} unit="%" max={80} />
              </Tile>
              <Tile title="This week" aside={<Chip tone="teal">Signed off</Chip>}>
                <Stats items={[{ value: "41%", label: "Locked baseline" }, { value: "6 min", label: "Staff per fill" }, { value: "2", label: "Hand-offs" }, { value: "0", label: "Complaints" }]} />
              </Tile>
            </Cluster>
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

      <PilotCta secondary={{ href: "/resources", label: "Read the guides" }} />
    </SiteShell>
  );
}
