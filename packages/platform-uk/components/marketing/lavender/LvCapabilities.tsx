import { Sparkle } from "lucide-react";

const CAPABILITIES = [
  {
    title: "Capture",
    sub: "Voice or notes into structured context",
    body: "The consultation becomes a structured diabetes draft that every other check starts from.",
  },
  {
    title: "Documentation",
    sub: "Reviewable drafts with cited evidence",
    body: "SOAP notes and coding suggestions sit next to the labs and guidelines they came from.",
  },
  {
    title: "Safety",
    sub: "Interaction and policy holds",
    body: "High-risk combinations, like apixaban with aspirin, are held until a clinician decides.",
  },
  {
    title: "Risk",
    sub: "Signals that need attention",
    body: "Admission and control-risk changes surface as drafts with their contributing factors listed.",
  },
  {
    title: "Referral",
    sub: "Pathway packages for sign-off",
    body: "Referrals, follow-ups and enrolment tasks are packaged for review, never sent on their own.",
  },
  {
    title: "Correlation",
    sub: "The clinical picture for the role",
    body: "Conditions, medicines and labs are assembled for the signed-in role, not dumped from the chart.",
  },
  {
    title: "Population",
    sub: "Governed aggregate intelligence",
    body: "Practice and ICS views show cohort signals without patient-level data leaving the clinic.",
  },
  {
    title: "Governance",
    sub: "Attributed decisions, audit trail",
    body: "Who drafted, who reviewed and what they decided is recorded on every Accept, Edit or Reject.",
  },
] as const;

export default function LvCapabilities() {
  return (
    <section className="lv-section" aria-labelledby="lv-capabilities-title" data-section="capabilities">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Specialised intelligence</p>
            <h2 id="lv-capabilities-title" className="lv-h2 mt-3">
              Clinical capabilities you can rely on
            </h2>
          </div>
          <p className="lv-lede">
            Eight capabilities, one governed workflow. Each one drafts; none of them writes to the record. A named
            clinician accepts, edits or rejects every output.
          </p>
        </div>

        <ul className="lv-cards">
          {CAPABILITIES.map((c, i) => (
            <li key={c.title} className="lv-card">
              <div className="lv-card__top">
                <span className="lv-spark" aria-hidden>
                  <Sparkle className="h-4 w-4" fill="currentColor" />
                </span>
                <span className="lv-card__num">{String(i + 1).padStart(3, "0")}</span>
              </div>
              <h3 className="lv-card__title">{c.title}</h3>
              <p className="lv-card__sub">{c.sub}</p>
              <p className="lv-card__body">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
