/**
 * Product UI rendered in HTML for the public site. Mirrors the real screens (slot fill, CGM monitoring, weekly review,
 * patient app). Every figure and name is illustrative and labelled as such.
 */
function Frame({ title, caption = "Illustrative example", children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <figure className="s-frame" aria-label={`${title} (illustrative)`}>
      <div className="s-frame__bar">
        <span className="s-frame__dots" aria-hidden><i /><i /><i /></span>
        <span className="s-frame__title">{title}</span>
      </div>
      <div className="s-frame__body">{children}</div>
      <figcaption className="s-frame__caption">{caption}</figcaption>
    </figure>
  );
}

export function SlotFillMock() {
  return (
    <Frame title="Fill cancelled slots">
      <div className="s-row">
        <div>
          <div className="s-ui-strong">Diabetes review · Thu 09:40 · 20 min</div>
          <div className="s-ui-muted">Main site · offer closes Wed 18:00</div>
        </div>
        <span className="s-pill s-pill--amber">Shadow mode</span>
      </div>
      <div className="s-card-ui s-card-ui--active">
        <div className="s-row">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="s-rank">1</span>
            <span className="s-ui-strong">R. Okafor</span>
          </div>
          <span className="s-pill s-pill--mint">Eligible</span>
        </div>
        <div className="s-tags">
          <span className="s-tag">Overdue care</span>
          <span className="s-tag">HbA1c due</span>
          <span className="s-tag">Waiting since 12 Aug</span>
        </div>
        <div className="s-ui-btns">
          <span className="s-ui-btn s-ui-btn--primary">Draft offer</span>
          <span className="s-ui-btn">Skip with reason</span>
        </div>
      </div>
      <div className="s-card-ui">
        <div className="s-row">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="s-rank">2</span>
            <span className="s-ui-strong">M. Haddad</span>
          </div>
          <span className="s-pill s-pill--mint">Eligible</span>
        </div>
        <div className="s-tags"><span className="s-tag">Patient asked</span><span className="s-tag">Waiting since 3 Sep</span></div>
      </div>
      <div className="s-card-ui">
        <div className="s-row">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="s-rank s-rank--muted">–</span>
            <span className="s-ui-strong" style={{ color: "var(--s-muted)" }}>J. Lindqvist</span>
          </div>
          <span className="s-pill s-pill--grey">Not offered</span>
        </div>
        <div className="s-ui-muted">No contact preference recorded · needs 24 h notice</div>
      </div>
    </Frame>
  );
}

export function CgmMock() {
  const rows = [
    { name: "A. Mensah", tir: 48, low: 6, vlow: 2, flag: "Time below 54 mg/dL is 1% or more", tone: "red" as const },
    { name: "S. Novak", tir: 61, low: 2, vlow: 0, flag: "Time in range is under 70%", tone: "amber" as const },
    { name: "L. Rossi", tir: 78, low: 1, vlow: 0, flag: "Within general targets", tone: "mint" as const },
  ];
  return (
    <Frame title="CGM monitoring">
      <div className="s-row">
        <span className="s-ui-strong">Patients by urgency · last 14 days</span>
        <span className="s-ui-muted">Trusted readings only</span>
      </div>
      {rows.map((r) => (
        <div key={r.name} className="s-card-ui">
          <div className="s-row">
            <span className="s-ui-strong">{r.name}</span>
            <span className="s-ui-muted">TIR {r.tir}% · TBR {r.low + r.vlow}%</span>
          </div>
          <div className="s-bar" aria-hidden>
            <span style={{ width: `${r.vlow}%`, background: "#8f1d14" }} />
            <span style={{ width: `${r.low}%`, background: "#e5484d" }} />
            <span style={{ width: `${r.tir}%`, background: "#1e4d52" }} />
            <span style={{ width: `${100 - r.tir - r.low - r.vlow}%`, background: "#c3cc6a" }} />
          </div>
          <span className={`s-pill s-pill--${r.tone}`} style={{ justifySelf: "start" }}>{r.flag}</span>
        </div>
      ))}
    </Frame>
  );
}

export function ReviewMock() {
  const weeks = [32, 38, 35, 44, 47, 52];
  return (
    <Frame title="Weekly review · week of 5 Oct">
      <div className="s-grid-ui">
        <div className="s-card-ui s-stat-ui"><b>52%</b><span>Fill rate · 13 of 25 slots</span></div>
        <div className="s-card-ui s-stat-ui"><b>31%</b><span>Locked baseline</span></div>
        <div className="s-card-ui s-stat-ui"><b>3.4 h</b><span>Median slot to booking</span></div>
      </div>
      <div className="s-card-ui">
        <span className="s-ui-muted">Fill rate by week</span>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 72 }} aria-hidden>
          {weeks.map((w, i) => (
            <span key={i} style={{ flex: 1, height: `${w * 1.3}px`, borderRadius: 6, background: i === weeks.length - 1 ? "#1e4d52" : "#dcef55" }} />
          ))}
        </div>
      </div>
      <div className="s-card-ui">
        <span className="s-ui-strong">What to discuss</span>
        <span className="s-ui-muted">1 booking was not found on read-back. Check the hand-off was resolved.</span>
        <span className="s-ui-muted">Staff chose someone other than the top-ranked patient twice.</span>
      </div>
    </Frame>
  );
}

export function PatientMock() {
  return (
    <Frame title="Patient app">
      <div className="s-card-ui">
        <span className="s-ui-strong">Add a reading</span>
        <div className="s-tags"><span className="s-tag">Glucose</span><span className="s-tag">Blood pressure</span><span className="s-tag">Weight</span></div>
      </div>
      <div className="s-card-ui">
        <div className="s-row"><span className="s-ui-strong">Glucose 122 mg/dL</span><span className="s-pill s-pill--mint">Shared with your clinic</span></div>
        <span className="s-ui-muted">Before breakfast · today 07:42</span>
      </div>
      <div className="s-card-ui">
        <div className="s-row"><span className="s-ui-strong">CGM upload · 14 days</span><span className="s-pill s-pill--grey">Awaiting clinician review</span></div>
        <span className="s-ui-muted">Counts in your clinic’s view once a clinician checks it</span>
      </div>
    </Frame>
  );
}

export function WorkflowMock() {
  const steps = [
    { t: "Slot received from your schedule", d: "Diabetes review · Thu 09:40", done: true },
    { t: "3 patients ranked, 1 not eligible", d: "Reasons shown for each", done: true },
    { t: "Offer approved by staff", d: "Not sent by Aksh · shadow mode", done: true },
    { t: "Patient accepted", d: "Waiting for your schedule to confirm", done: true },
    { t: "Booking verified on read-back", d: "Counted as filled", done: true, strong: true },
  ];
  return (
    <Frame title="Slot history">
      <ol style={{ display: "grid", gap: 0 }}>
        {steps.map((s, i) => (
          <li key={s.t} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 12, paddingBottom: i === steps.length - 1 ? 0 : 14, position: "relative" }}>
            <span aria-hidden style={{ width: 22, height: 22, borderRadius: "50%", background: s.strong ? "#121715" : "#dcef55", color: s.strong ? "#dcef55" : "#121715", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, zIndex: 1 }}>✓</span>
            {i < steps.length - 1 ? <span aria-hidden style={{ position: "absolute", left: 10, top: 22, bottom: 0, width: 2, background: "#e3e1d6" }} /> : null}
            <span style={{ display: "grid", gap: 2 }}>
              <span className="s-ui-strong">{s.t}</span>
              <span className="s-ui-muted">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="s-card-ui" style={{ background: "#fdf3e1", borderColor: "#f3dcae" }}>
        <span className="s-ui-strong" style={{ color: "#7a4800" }}>If the schedule does not show the booking</span>
        <span className="s-ui-muted">Aksh never counts it. A hand-off goes to your reception queue with a due time.</span>
      </div>
    </Frame>
  );
}

/** The platform's core idea: every output is a draft in one review queue until a named clinician decides. */
export function ReviewQueueMock() {
  const items = [
    { t: "HbA1c 8.4%", d: "Lab result · trend rising over 9 months", s: "Needs review", tone: "amber" as const },
    { t: "Interaction: anticoagulant with aspirin", d: "Medication safety · held for pharmacist", s: "Held", tone: "red" as const },
    { t: "HbA1c “about 7.5%”", d: "Patient-reported · not yet verified", s: "Unverified", tone: "grey" as const },
    { t: "Medication review booked", d: "Approved by named clinician · audited", s: "Approved", tone: "mint" as const },
  ];
  return (
    <Frame title="Review queue">
      <div className="s-row">
        <div>
          <div className="s-ui-strong">Diabetes review · patient record</div>
          <div className="s-ui-muted">4 drafts · nothing reaches the record without a decision</div>
        </div>
        <span className="s-pill s-pill--mint">Named reviewer</span>
      </div>
      {items.map((i) => (
        <div key={i.t} className="s-card-ui">
          <div className="s-row">
            <span className="s-ui-strong">{i.t}</span>
            <span className={`s-pill s-pill--${i.tone}`}>{i.s}</span>
          </div>
          <span className="s-ui-muted">{i.d}</span>
        </div>
      ))}
      <div className="s-row">
        <span className="s-ui-muted">Clinician decides</span>
        <div className="s-ui-btns">
          <span className="s-ui-btn">Reject</span>
          <span className="s-ui-btn">Edit</span>
          <span className="s-ui-btn s-ui-btn--primary">Accept</span>
        </div>
      </div>
    </Frame>
  );
}
