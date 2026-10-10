import { Layers, ShieldAlert } from "lucide-react";

const FAILURES = [
  {
    icon: Layers,
    title: "Point tools that don’t compose",
    body: "Separate risk, coding and coaching apps, each with its own trust and safety boundary. The clinician becomes the integration layer.",
  },
  {
    icon: ShieldAlert,
    title: "Automation that oversteps",
    body: "Auto-writes to the record, auto-dosing, diagnostic claims with nobody accountable in the loop.",
  },
] as const;

const ANSWER = [
  { k: "One orchestrator", v: "A supervisor runs every agent in a fixed, inspectable order" },
  { k: "One audit trail", v: "Records who drafted, who decided and what changed" },
  { k: "One consent model", v: "Identity and consent shared by every module and role" },
  { k: "One rule", v: "Nothing reaches a record or prescription without a human decision" },
] as const;

export default function LvProblem() {
  return (
    <section className="lv-section" aria-labelledby="lv-problem-title" data-section="problem">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">The problem</p>
            <h2 id="lv-problem-title" className="lv-h2 mt-3">
              Clinical AI fails in two predictable ways.
            </h2>
          </div>
          <p className="lv-lede">
            Aksh is built as one auditable intelligence layer beside the EHR, so every capability shares the same
            safety, audit and consent boundary.
          </p>
        </div>

        <div className="lv-problem">
          {FAILURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="lv-problem__fail">
              <span className="lv-step__icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="lv-card__title">{title}</h3>
              <p className="lv-card__body">{body}</p>
            </div>
          ))}
          <div className="lv-problem__answer">
            <p className="text-sm text-white/80">Aksh’s answer</p>
            <dl className="lv-problem__list">
              {ANSWER.map((a) => (
                <div key={a.k}>
                  <dt>{a.k}</dt>
                  <dd>{a.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
