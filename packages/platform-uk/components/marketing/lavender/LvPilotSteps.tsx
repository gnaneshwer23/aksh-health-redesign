import Link from "next/link";
import { ClipboardList, FlaskConical, Send, TrendingUp } from "lucide-react";

const STEPS = [
  {
    label: "Step one",
    title: "Request organisation access",
    body: "Tell us about your practice or ICS. We reply within two business days.",
    icon: Send,
  },
  {
    label: "Step two",
    title: "Scope one workflow",
    body: "Pick a diabetes review pathway, name the reviewers and set the governance boundaries.",
    icon: ClipboardList,
  },
  {
    label: "Step three",
    title: "Rehearse on synthetic data",
    body: "Run the full loop on a synthetic clinic. Live patient data waits for your DPIA and approvals.",
    icon: FlaskConical,
  },
  {
    label: "Step four",
    title: "Expand on evidence",
    body: "Measure review time and safety holds, then widen scope only when the evidence supports it.",
    icon: TrendingUp,
  },
] as const;

export default function LvPilotSteps() {
  return (
    <section className="lv-section lv-section--flush" aria-labelledby="lv-pilot-title">
      <div className="lv-container">
        <div className="lv-steps-wrap">
          <div className="lv-section-head lv-section-head--flush">
            <div>
              <p className="lv-eyebrow">Start with a controlled use case</p>
              <h2 id="lv-pilot-title" className="lv-h2 mt-3">
                A pilot that earns its next step.
              </h2>
            </div>
            <p className="lv-lede">
              Diabetes care, properly coordinated, beside your EHR rather than instead of it. Each stage has an exit
              you control.
            </p>
          </div>

          <ol className="lv-steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="lv-step">
                  <span className="lv-step__num" aria-hidden>
                    {i + 1}
                  </span>
                  <span className="lv-step__icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="lv-step__label">{s.label}</p>
                  <h3 className="lv-step__title">{s.title}</h3>
                  <p className="lv-step__body">{s.body}</p>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 flex justify-center">
            <Link href="/get-started" className="lv-btn lv-btn--violet">
              Request a pilot
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
