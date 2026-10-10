import Link from "next/link";

import { NON_OBJECTIVES } from "@/components/marketing/lavender/vision-content";

const TRACKS = [
  {
    name: "Track A",
    title: "Synthetic clinic and pilot rehearsal",
    detail: "Demo dashboards, clinician review, FHIR staging and a simulated EHR chart. No live patient data written anywhere.",
    status: { label: "Available now", tone: "approved" },
  },
  {
    name: "Track B",
    title: "Live NHS clinical use",
    detail: "Real patient data and live EMIS / SystmOne write-back. Needs DPIA, clinical safety sign-off and partner approval first.",
    status: { label: "Not available by design", tone: "held" },
  },
] as const;

export default function LvTracks() {
  return (
    <section className="lv-section lv-section--flush" aria-labelledby="lv-tracks-title" data-section="tracks">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Built with ambition, communicated with precision</p>
            <h2 id="lv-tracks-title" className="lv-h2 mt-3">
              What you can use today, and what waits for governance.
            </h2>
          </div>
          <p className="lv-lede">
            We never sell Track A as Track B, and rehearsal artefacts are never presented as approvals.{" "}
            <Link href="/security" className="font-medium text-[var(--lv-indigo)] underline-offset-2 hover:underline">
              Read our safety posture
            </Link>
          </p>
        </div>

        <div className="lv-tracks">
          {TRACKS.map((t) => (
            <div key={t.name} className="lv-honesty__col">
              <div className="lv-honesty__head">
                <h3 className="lv-honesty__title">
                  {t.name} · {t.title}
                </h3>
                <span className={`lv-status lv-status--${t.status.tone}`}>{t.status.label}</span>
              </div>
              <p className="lv-card__body mt-0">{t.detail}</p>
            </div>
          ))}
          <div className="lv-honesty__col lv-tracks__nos">
            <div className="lv-honesty__head">
              <h3 className="lv-honesty__title">What Aksh will not do</h3>
              <span className="lv-status lv-status--held">hard limits</span>
            </div>
            <ul className="lv-honesty__list lv-tracks__list">
              {NON_OBJECTIVES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
