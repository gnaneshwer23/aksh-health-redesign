import Link from "next/link";

const SOURCES = [
  { title: "Inbound contact", detail: "Calls, texts, web chat" },
  { title: "Recall campaigns", detail: "Missed, lapsed, check-ins" },
  { title: "Open slots", detail: "Cancellations refilled" },
] as const;

const WORK = [
  { title: "Scheduling", detail: "Book, move, cancel" },
  { title: "Referral Desk", detail: "Letter to booking" },
  { title: "Answers", detail: "Practice questions, cited" },
  { title: "Health updates", detail: "Readings and symptoms" },
] as const;

const LANDS = [
  { title: "Practice calendar", detail: "Simulated now; GP Connect later" },
  { title: "GP review queue", detail: "Patient-reported, unverified until Accept" },
  { title: "Staff hand-off", detail: "Emergencies, clinical questions, edge cases" },
] as const;

export default function LvPatientAccess() {
  return (
    <section className="lv-section" aria-labelledby="lv-access-title" data-section="patient-access">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Patient access · Front Desk and Asha</p>
            <h2 id="lv-access-title" className="lv-h2 mt-3">
              Every patient conversation feeds the same clinical loop.
            </h2>
          </div>
          <p className="lv-lede">
            Asha answers the practice phone and calls patients back. Bookings resolve on their own; anything clinical becomes
            a draft for a GP; emergencies get a 999 message and go straight to a person. Synthetic practice today, with
            simulated telephony.
          </p>
        </div>

        <div className="lv-access" aria-label="Patient access flow">
          <ol className="lv-access__row">
            {SOURCES.map((s) => (
              <li key={s.title} className="lv-access__card">
                <span className="lv-access__title">{s.title}</span>
                <span className="lv-access__detail">{s.detail}</span>
              </li>
            ))}
          </ol>
          <div className="lv-access__hub">
            <span className="lv-access__title">Asha · Front Desk</span>
            <span className="lv-access__detail">Safety screen every turn → identity → intent → action or hand-off</span>
          </div>
          <ol className="lv-access__row lv-access__row--4">
            {WORK.map((s) => (
              <li key={s.title} className="lv-access__card lv-access__card--soft">
                <span className="lv-access__title">{s.title}</span>
                <span className="lv-access__detail">{s.detail}</span>
              </li>
            ))}
          </ol>
          <ol className="lv-access__row">
            {LANDS.map((s) => (
              <li key={s.title} className="lv-access__card">
                <span className="lv-access__title">{s.title}</span>
                <span className="lv-access__detail">{s.detail}</span>
              </li>
            ))}
          </ol>
          <div className="lv-access__lift">
            <span>
              <strong>Baseline locked before go-live</strong> · calls answered, wait, slots filled, missed appointments rebooked
            </span>
            <span>
              <strong>Lift measured against it</strong> · labelled unverified until checked against practice data
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/asha" className="lv-btn lv-btn--violet">
            Talk to Asha
          </Link>
          <Link href="/dashboard/front-desk" className="lv-btn lv-btn--outline">
            Open the Front Desk console
          </Link>
        </div>
      </div>
    </section>
  );
}
