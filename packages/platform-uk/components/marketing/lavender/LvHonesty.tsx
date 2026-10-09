import Link from "next/link";

import type { ClinicalStatus } from "@/components/marketing/clinical-status";

type Column = {
  title: string;
  status: ClinicalStatus;
  chip: string;
  items: { label: string; note: string }[];
};

// Keep in step with /security "What we do not claim" and the launch audit scope.
const COLUMNS: Column[] = [
  {
    title: "Working in this build",
    status: "approved",
    chip: "synthetic clinic",
    items: [
      { label: "Clinician review queue", note: "Accept, Edit or Reject on every draft" },
      { label: "FHIR R4 staging", note: "Accepted outputs staged beside the EHR" },
      { label: "Attributed audit trail", note: "Reviewer, time and decision recorded" },
      { label: "Eight role dashboards", note: "Running on synthetic patients" },
    ],
  },
  {
    title: "Being evaluated",
    status: "needs-review",
    chip: "not yet live",
    items: [
      { label: "Diabetes risk signals", note: "Evaluated against synthetic cohorts" },
      { label: "Graph-backed evidence", note: "Falls back to fixtures when the graph is offline" },
      { label: "Patient-access outreach", note: "Adapter staged and switched off" },
    ],
  },
  {
    title: "What we don’t claim",
    status: "held",
    chip: "by design",
    items: [
      { label: "MHRA certification or registration", note: "No device registration or marking" },
      { label: "Completed DCB0129 or DPIA sign-off", note: "Safety case in progress" },
      { label: "Live EMIS or SystmOne write-back", note: "Simulated rehearsal only" },
      { label: "Autonomous decisions", note: "No diagnosis, prescribing or treatment without a clinician" },
    ],
  },
];

export default function LvHonesty() {
  return (
    <section className="lv-section lv-section--flush" aria-labelledby="lv-honesty-title">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Built with ambition, communicated with precision</p>
            <h2 id="lv-honesty-title" className="lv-h2 mt-3">
              What’s live, what’s evaluated, what isn’t.
            </h2>
          </div>
          <p className="lv-lede">
            If a badge or sentence would overstate status, we leave it out.{" "}
            <Link href="/security" className="font-medium text-[var(--lv-indigo)] underline-offset-2 hover:underline">
              Read our safety posture
            </Link>
          </p>
        </div>

        <div className="lv-honesty">
          {COLUMNS.map((col) => (
            <div key={col.title} className="lv-honesty__col">
              <div className="lv-honesty__head">
                <h3 className="lv-honesty__title">{col.title}</h3>
                <span className={`lv-status lv-status--${col.status}`}>{col.chip}</span>
              </div>
              <ul className="lv-honesty__list">
                {col.items.map((item) => (
                  <li key={item.label}>
                    {item.label}
                    <small>{item.note}</small>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
