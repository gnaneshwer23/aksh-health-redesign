import Link from "next/link";
import { ClipboardList, FlaskConical, Send, TrendingUp } from "lucide-react";

const STEPS = [
  {
    label: "Step one",
    title: "Start free",
    body: "Anyone on your team creates an account and works in a sandbox clinic straight away.",
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
    body: "Run the full loop in the sandbox. Live patient data waits for your DPIA and approvals.",
    icon: FlaskConical,
  },
  {
    label: "Step four",
    title: "Go live on evidence",
    body: "Tell us about your organisation. Live use starts with one workflow and widens only when the evidence supports it.",
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
                From free account to live clinic, one step at a time.
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

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="lv-btn lv-btn--violet">
              Start free
            </Link>
            <Link href="/get-started" className="lv-btn lv-btn--outline">
              Bring Aksh to your organisation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
