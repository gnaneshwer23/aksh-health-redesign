/**
 * Resources: practical guides for clinics. Written from the product's actual behaviour; keep in step with the code
 * (eligibility rules, CSV columns, connector formats, go-live items, metric definitions).
 */
import type { ReactNode } from "react";

import { AUTO_ITEMS, EVIDENCE_ITEMS } from "@/lib/golive/checklist";
import { APPOINTMENT_TYPE_LABEL } from "@/lib/access/eligibility";
import { LAB_CATALOG, LAB_KINDS } from "@/lib/labs/catalog";
import { PATIENT_CSV_COLUMNS, PATIENT_CSV_TEMPLATE } from "@/lib/network/csv";

export type Guide = { slug: string; title: string; summary: string; group: "Start" | "Workflows" | "Connect" | "Governance"; body: ReactNode };

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="s-table-wrap">
      <table className="s-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

const CSV_NOTES: Record<string, string> = {
  record_number: "Required. Your records system’s patient number; used to match bookings and device data.",
  given_name: "Required.",
  family_name: "Required.",
  date_of_birth: "Required. YYYY-MM-DD.",
  sex: "female, male, other or unknown.",
  diabetes_type: "For example type_1, type_2.",
  email: "Optional contact detail.",
  phone: "Optional contact detail.",
  preferred_channel: "How the patient prefers to be contacted (for example sms, phone, email). Patients without one are not offered slots.",
  latest_hba1c_mmol_mol: "Optional. Most recent HbA1c in mmol/mol (IFCC). If your records use %, add a latest_hba1c_percent column instead.",
  hba1c_date: "Optional. YYYY-MM-DD of that HbA1c.",
  egfr: "Optional. eGFR in mL/min/1.73 m².",
  urine_acr_mg_mmol: "Optional. Urine albumin:creatinine ratio in mg/mmol.",
  creatinine_umol_l: "Optional. Serum creatinine in µmol/L.",
  ldl_mmol_l: "Optional. LDL cholesterol in mmol/L.",
  total_cholesterol_mmol_l: "Optional. Total cholesterol in mmol/L.",
  hdl_mmol_l: "Optional. HDL cholesterol in mmol/L.",
  triglycerides_mmol_l: "Optional. Triglycerides in mmol/L.",
  alt_u_l: "Optional. ALT in U/L.",
  labs_date: "Required when any laboratory column is filled. YYYY-MM-DD of those results. Values in another unit or outside a plausible range are reported row by row, not stored.",
};

export const GUIDES: Guide[] = [
  {
    slug: "getting-started",
    group: "Start",
    title: "Getting started",
    summary: "Set up your clinic, invite your team and secure every account.",
    body: (
      <>
        <p>Aksh is organised around your organisation: a clinic, practice or diabetes service. Everything you add belongs to it and is visible only to its members.</p>
        <h2>1. Create your account and clinic</h2>
        <ol>
          <li>Create an account and choose your role: physician, nurse, pharmacist or clinic manager.</li>
          <li>Choose <strong>Set up my clinic</strong> and enter its name. You become its admin. Your clinic starts empty.</li>
          <li>If someone has invited you, choose <strong>I have an invite code</strong> instead.</li>
        </ol>
        <h2>2. Invite your team</h2>
        <p>In <strong>Organisation → Staff</strong>, create an invite for each colleague with their role. Each code is single use, shown once, and expires after 14 days. Make at least one other person an admin.</p>
        <p>Before go-live, every clinician’s professional registration must be checked and recorded in the same section.</p>
        <h2>3. Turn on two-step sign-in</h2>
        <p>In <strong>Security</strong>, scan the code with an authenticator app and confirm a code. Store the recovery codes somewhere safe; each works once.</p>
        <h2>4. Set your clinic details</h2>
        <p>In <strong>Organisation → Settings</strong>, set the time zone, glucose and HbA1c units, and the emergency number shown to patients.</p>
        <div className="s-note">Next: <a href="/resources/importing-patients">import your patients</a>, then <a href="/resources/slot-fill">build the waiting list</a>.</div>
      </>
    ),
  },
  {
    slug: "importing-patients",
    group: "Start",
    title: "Importing patients",
    summary: "Load your diabetes register from a spreadsheet export.",
    body: (
      <>
        <p>Import patients in <strong>Organisation → Patients</strong> from a CSV file exported from your records system, or add them one at a time. Every row is validated before anything is saved, and problems are listed by row.</p>
        <h2>Columns</h2>
        <p>The first row must contain these column names. Unknown columns are ignored; blank cells are treated as missing.</p>
        <Table head={["Column", "Notes"]} rows={PATIENT_CSV_COLUMNS.map((c) => [<code key={c}>{c}</code>, CSV_NOTES[c] ?? ""])} />
        <h2>Template</h2>
        <pre><code>{PATIENT_CSV_TEMPLATE}</code></pre>
        <h2>Good practice</h2>
        <ul>
          <li>Use the same record number your scheduling system uses, so bookings and device data match the right patient.</li>
          <li>Import in batches; a re-import of the same record number does not create a duplicate.</li>
          <li>Record a contact preference for everyone you may offer a slot to.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "slot-fill",
    group: "Workflows",
    title: "Waiting list and slot fill",
    summary: "How patients are matched to freed appointments, and what staff do at each step.",
    body: (
      <>
        <h2>The waiting list</h2>
        <p>Add a patient to the waiting list for an appointment type, with the reason they are waiting. Optional details narrow which slots they can be offered: earliest and latest dates, minimum notice, preferred sites and accessibility needs.</p>
        <Table head={["Appointment type", "Code"]} rows={Object.entries(APPOINTMENT_TYPE_LABEL).map(([k, v]) => [v.charAt(0).toUpperCase() + v.slice(1), <code key={k}>{k}</code>])} />
        <h2>Who is eligible</h2>
        <p>For each freed slot, every waiting patient for that appointment type is checked. A patient is offered only if all of these hold; otherwise they are listed with the reason.</p>
        <Table
          head={["Rule", "Shown when it fails"]}
          rows={[
            ["Still on the waiting list", "NOT_WAITING"],
            ["Appointment type matches", "TYPE_MISMATCH"],
            ["Not before their earliest date, not after their latest", "BEFORE_EARLIEST_DATE, AFTER_LATEST_DATE"],
            ["Enough notice before the slot", "INSUFFICIENT_NOTICE"],
            ["At a preferred site, if they named any", "SITE_NOT_PREFERRED"],
            ["Has not opted out of contact", "OPTED_OUT"],
            ["Not already holding another live offer", "ALREADY_HOLDS_OFFER"],
            ["The offer window is still open", "OFFER_WINDOW_CLOSED"],
            ["Fewer offers in 30 days than your limit (default 3)", "FREQUENCY_CAP"],
            ["Contact preference recorded and its channel allowed", "NO_CONTACT_PREFERENCE, CHANNEL_SUPPRESSED"],
          ]}
        />
        <h2>Ranking</h2>
        <p>Eligible patients are ranked by the reason they are waiting, in the order your clinic sets (default: overdue care, then patient request, then clinician request), and then by how long they have waited. Admins change the order and the offer limit in <strong>Fill slots → Your clinic’s rules</strong>.</p>
        <h2>The steps</h2>
        <ol>
          <li><strong>Find patients.</strong> Aksh runs the checks and ranks the list.</li>
          <li><strong>Draft offer.</strong> Staff choose a patient. The offer text comes from an approved template with only the appointment and your clinic’s details. Staff may edit the wording.</li>
          <li><strong>Approve contact.</strong> In shadow mode Aksh records that nothing was sent; staff send the offer through your usual channel.</li>
          <li><strong>Record the response.</strong> Accepted, declined or no response. A decline returns the patient to the list with their place kept.</li>
          <li><strong>Confirm the booking.</strong> Check your schedule. If the booking is there, the slot is filled. If not, a hand-off is created for a person to resolve.</li>
        </ol>
        <p>Staff can also skip a patient with a reason, defer a slot within its offer window, or hand the slot to reception at any point.</p>
        <div className="s-note">Every action is recorded once, even if a button is pressed twice, and history cannot be edited.</div>
      </>
    ),
  },
  {
    slug: "cgm-and-readings",
    group: "Workflows",
    title: "CGM and readings",
    summary: "Upload CGM data, review what patients share, and read the metrics.",
    body: (
      <>
        <h2>Getting glucose data in</h2>
        <ul>
          <li><strong>Clinic uploads:</strong> on a patient’s page, upload a CGM export. Dexcom Clarity, LibreView and generic CSV files are recognised by their column names, in mmol/L or mg/dL. You see a preview before saving.</li>
          <li><strong>Patient uploads:</strong> patients upload from the app. Their data counts in clinic views only after a clinician reviews the upload.</li>
          <li><strong>Device feed:</strong> a device or aggregator sends FHIR R4 glucose Observations through the connector. See the <a href="/resources/schedule-connector">connector guide</a>.</li>
        </ul>
        <p>Ambiguous times (for example across a clock change) and values outside 18–720 mg/dL (1–40 mmol/L) are rejected with a reason rather than guessed.</p>
        <h2>Metrics</h2>
        <p>Calculated over the last 14 days from trusted readings, following the international consensus on time in range.</p>
        <Table
          head={["Metric", "Range, mg/dL (mmol/L)", "General adult target"]}
          rows={[
            ["Time in range", "70–180 (3.9–10.0)", "More than 70%"],
            ["Time below range", "Below 70 (3.9)", "Less than 4%"],
            ["Time below 54", "Below 54 (3.0)", "Less than 1%"],
            ["Time above range", "Above 180 (10.0)", "Less than 25%"],
            ["Time above 250", "Above 250 (13.9)", "Less than 5%"],
            ["Coefficient of variation", "", "36% or less"],
            ["GMI", "Estimated from mean glucose", "Shown, not targeted"],
          ]}
        />
        <p>Data is treated as sufficient with at least 14 days and 70% sensor wear; otherwise the metrics carry a warning. Targets differ for older or high-risk people and in pregnancy; the clinician decides which apply.</p>
        <h2>The worklist</h2>
        <p><strong>CGM monitoring</strong> orders patients by urgency: low glucose first, then time below range, then no recent data, then high glucose, then insufficient data. Patients with only unreviewed uploads appear so they are not missed.</p>
        <h2>Shared readings</h2>
        <p>Glucose, blood pressure and weight shared by patients appear in <strong>Patients</strong> for review, flagged readings first. Checking them marks them as verified.</p>
      </>
    ),
  },
  {
    slug: "schedule-connector",
    group: "Connect",
    title: "Schedule connector",
    summary: "Send freed slots, bookings, glucose readings and laboratory results from your systems.",
    body: (
      <>
        <p>Create a connection in <strong>Organisation → Connections</strong>. The key is shown once; Aksh stores only its hash. Send it as a bearer token. Every request returns a result code per item, so your system can act on each one.</p>
        <Table
          head={["Endpoint", "Purpose", "Accepts"]}
          rows={[
            [<code key="s">POST /api/connect/v1/slots</code>, "Freed or taken slots", "FHIR R4 Slot or Bundle, or { slots: [...] }"],
            [<code key="a">POST /api/connect/v1/appointments</code>, "Bookings read back from your schedule", "FHIR R4 Appointment or Bundle, or { appointments: [...] }"],
            [<code key="o">POST /api/connect/v1/observations</code>, "Glucose readings from devices, and laboratory results", "FHIR R4 Observation or Bundle"],
          ]}
        />
        <h2>Slots</h2>
        <pre><code>{`curl -X POST https://www.akshhealth.com/api/connect/v1/slots \\
  -H "Authorization: Bearer <connection key>" \\
  -H "Content-Type: application/json" \\
  -d '{ "slots": [ { "id": "S-1042", "version": 1, "status": "free",
        "appointmentType": "diabetes_review",
        "start": "2026-11-05T09:40:00+00:00", "durationMin": 20, "site": "Main site" } ] }'`}</code></pre>
        <ul>
          <li><code>id</code> and an increasing <code>version</code> are required; resending the same version is safe. For FHIR, send <code>meta.versionId</code> or <code>meta.lastUpdated</code>.</li>
          <li>Times need an offset (<code>Z</code> or <code>+hh:mm</code>). Slots last 5–240 minutes.</li>
          <li>Map your own appointment codes to Aksh types in the connection settings. Unmapped types are reported as <code>UNKNOWN_APPOINTMENT_TYPE</code>.</li>
          <li>Offers close a set number of hours before the slot (default 2). A slot too close to start is reported as <code>OFFER_WINDOW_CLOSED</code>.</li>
          <li>A slot that becomes <code>busy</code> before anyone was offered it is withdrawn; after an offer, a person is asked to look.</li>
        </ul>
        <h2>Appointments</h2>
        <p>Send bookings with their slot reference and the patient’s record number (<code>{`{ id, status, slotId, patientRecordNumber }`}</code> in JSON). A booking for the patient staff selected, with status booked, arrived, fulfilled or checked-in, confirms the slot as filled. A different patient means the slot went elsewhere, and a person resolves it.</p>
        <h2>Glucose observations</h2>
        <p>Final, amended or corrected glucose Observations with an exact value and a timestamp with an offset. <code>subject.identifier.value</code> must be the patient’s record number. Duplicates by patient and time are skipped.</p>
        <h2>Laboratory results</h2>
        <p>
          Send laboratory results as FHIR R4 Observations with a LOINC code, an <code>id</code> from your system, an exact
          value with its unit, and a time with an offset. Aksh converts each value to the unit it stores and refuses values
          outside a plausible range, which usually means a unit error. Glucose is treated as a laboratory result only when
          <code> category</code> is <code>laboratory</code>; otherwise it is a device reading.
        </p>
        <Table
          head={["Result", "Stored as", "Also accepted", "LOINC (examples)"]}
          rows={LAB_KINDS.map((k) => {
            const d = LAB_CATALOG[k];
            return [d.label, d.unit, Object.keys(d.units).filter((u) => u !== d.unit.toLowerCase()).join(", ") || "—", d.loinc.slice(0, 3).join(", ")];
          })}
        />
        <ul>
          <li>The same result sent again is skipped. A changed value must be sent with status <code>amended</code> or <code>corrected</code>: it replaces the earlier result, and both stay in the record. A changed value sent as <code>final</code> is refused (<code>LAB_CONFLICTING_FINAL</code>).</li>
          <li>Each result keeps its LOINC code, your <code>id</code>, the value and unit as sent, and the connection that sent it.</li>
        </ul>
        <h2>Common result codes</h2>
        <Table
          head={["Code", "Meaning"]}
          rows={[
            ["MISSING_VERSION / INVALID_VERSION", "Send an integer version that increases with every change"],
            ["INVALID_START / INVALID_END", "Use an ISO date-time with an offset"],
            ["SLOT_STALE", "The slot has already started"],
            ["UNKNOWN_APPOINTMENT_TYPE", "Map this type in the connection settings"],
            ["NO_PATIENT_IDENTIFIER", "Include the patient’s record number"],
            ["INEXACT_VALUE", "A value with <, > or similar is a bound, not a reading"],
            ["OUT_OF_RANGE / FUTURE_TIME", "Glucose outside 18–720 mg/dL (1–40 mmol/L), or a time in the future"],
            ["LAB_UNKNOWN_UNIT / LAB_OUT_OF_RANGE", "Send a unit from the table above; check the value and unit match"],
            ["LAB_UNKNOWN_CODE / LAB_MISSING_ID", "Use a LOINC code from the table, and include the Observation id"],
            ["LAB_CONFLICTING_FINAL", "Send the changed result as amended or corrected"],
          ]}
        />
      </>
    ),
  },
  {
    slug: "going-live",
    group: "Governance",
    title: "Going live",
    summary: "What your organisation needs before Aksh is used with real patients.",
    body: (
      <>
        <p>Every organisation starts in setup. Live use begins only after an Aksh reviewer accepts each item below and approves the organisation. The checklist is in <strong>Organisation → Go-live</strong>.</p>
        <h2>Evidence you submit</h2>
        <Table head={["Item", "What it is"]} rows={Object.values(EVIDENCE_ITEMS).map((i) => [i.title, i.help])} />
        <h2>Checked automatically</h2>
        <ul>{Object.values(AUTO_ITEMS).map((t) => <li key={t}>{t}</li>)}</ul>
        <h2>After approval</h2>
        <p>Your organisation runs in shadow mode: staff make every contact through your own channel and Aksh keeps the record. The baseline cannot be changed once accepted, so results are always measured against what you had before.</p>
        <div className="s-note">A privacy impact assessment with high residual risk is not accepted; reduce the risk first. We can share our data processing agreement and help with your assessment: <a href="/contact">contact us</a>.</div>
      </>
    ),
  },
  {
    slug: "measuring-results",
    group: "Governance",
    title: "Measuring results",
    summary: "The fill-rate definition, the baseline, and the weekly review.",
    body: (
      <>
        <h2>One definition</h2>
        <p>A slot is <strong>filled</strong> when the patient accepted before the offer expired and the booking was verified on read-back before the slot started. Fill rate is filled slots divided by slots received, excluding slots your clinic withdrew. Rehearsal data is never counted.</p>
        <h2>The baseline</h2>
        <p>Before go-live you record how many freed slots you had and filled over at least four weeks, and how you counted them. Once accepted it is locked.</p>
        <h2>Comparing</h2>
        <p>Rates are shown with their counts and a 95% range. No comparison with the baseline is made until both periods have at least 20 slots, and the difference is reported as higher, lower or not yet clear.</p>
        <h2>The weekly review</h2>
        <p>For each week (Monday to Monday in your time zone), the review shows the slot funnel, the fill rate against the previous week and the baseline, how often staff took the top-ranked patient, skip reasons, response times, hand-offs, connector results and waiting-list data gaps, with points to discuss. An admin signs off the week once it has ended; the figures are frozen with the sign-off, and corrections are added as addenda.</p>
      </>
    ),
  },
  {
    slug: "data-protection",
    group: "Governance",
    title: "Data protection",
    summary: "What Aksh holds, who can see it, export and retention.",
    body: (
      <>
        <h2>Roles</h2>
        <p>Your organisation is the controller of the patient data it brings to Aksh; Aksh processes it on your instructions under a data processing agreement. A patient’s own account data, before they link to a clinic, is held for that patient.</p>
        <h2>What is held</h2>
        <ul>
          <li>Patient details you import, the waiting list, slots and the record of each action.</li>
          <li>Readings and CGM data from uploads, devices and the patient app.</li>
          <li>Staff accounts, registrations checked, invites and organisation settings.</li>
          <li>An audit trail of significant actions.</li>
        </ul>
        <h2>Export</h2>
        <p>Organisation admins export everything their organisation holds from <strong>Organisation → Settings</strong>, in one machine-readable file. Patients download their own record from the app. Both are audited.</p>
        <h2>Retention</h2>
        <p>Clinical records and their history are kept for the life of your agreement and returned or deleted at its end, as the agreement sets out. Error logs are kept for 90 days, scrubbed of personal details. Rate-limit counters are kept for 24 hours.</p>
        <p>See also <a href="/security">Security</a> and our <a href="/privacy">privacy notice</a>.</p>
      </>
    ),
  },
];

export const GUIDE_GROUPS: Guide["group"][] = ["Start", "Workflows", "Connect", "Governance"];
