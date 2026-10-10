import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldCheck } from "lucide-react";

import { CLINICAL_STATUS, type ClinicalStatus } from "@/components/marketing/clinical-status";

type Signal = {
  title: string;
  kind: string;
  code?: string;
  status: ClinicalStatus;
};

// Canonical synthetic patient P002. Keep these values identical to /demo/patel and the GP review queue
// (HbA1c 68 mmol/mol = 8.4%).
const SIGNALS: Signal[] = [
  { title: "HbA1c 68 mmol/mol", kind: "Lab result", code: "LOINC 59261-8", status: "needs-review" },
  { title: "Apixaban with aspirin", kind: "Interaction check", status: "held" },
  { title: "HbA1c “about 60”", kind: "Patient-reported, phone intake", status: "unverified" },
  { title: "Medication review booked", kind: "Dr S. Williams, 10:42", status: "approved" },
];

const ROLE_INITIALS = ["GP", "RN", "Rx", "AD"];

const TRUST = [
  { title: "Human review", detail: "Named clinician decides" },
  { title: "Auditability", detail: "Every decision attributed" },
  { title: "Regional data residency", detail: "Data stays in your market" },
  { title: "Diabetes & primary care", detail: "Focused clinical wedge" },
] as const;

export default function LvHero() {
  return (
    <section className="lv-hero" aria-labelledby="lv-hero-title">
      <div className="lv-hero__card">
        <div className="lv-hero__grid">
          <div>
            <span className="lv-hero__badge">
              <span className="lv-hero__badge-dot" aria-hidden>
                ✦
              </span>
              Aksh Intelligence Platform · first module: Aksh Diabetes
            </span>

            <h1 id="lv-hero-title" className="lv-hero__title">
              Clinical intelligence, under clinical control.
            </h1>

            <p className="lv-hero__lede">
              One auditable, human-in-the-loop intelligence layer beside your EHR. It turns notes, labs, medicines and
              what patients report into explainable drafts. A named clinician decides; the platform never decides alone.
            </p>

            <div className="lv-hero__actions">
              <Link href="/signup" className="lv-btn lv-btn--ink">
                Start free
              </Link>
              <Link href="/dashboard/gp" className="lv-btn lv-btn--glass">
                Try without an account
              </Link>
            </div>
            <p className="lv-hero__sub">
              Free synthetic workspace with 500 patients. No card, no real patient data.{" "}
              <Link href="/demo/patel" className="lv-hero__sublink lv-focus">
                Or walk through Mr Patel’s case →
              </Link>
            </p>

            <Link href="/platform#roles" className="lv-hero__chip lv-focus">
              <span className="lv-hero__roles" aria-hidden>
                {ROLE_INITIALS.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </span>
              <span>
                Eight role dashboards,
                <br />
                one governed review queue
              </span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="lv-stage">
            <div className="lv-float lv-float--top lv-rise" style={{ ["--i" as string]: 5 }}>
              <span className="lv-float__icon" aria-hidden>
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>
                Named reviewer
                <small>Dr S. Williams · audit recorded</small>
              </span>
            </div>

            <div className="lv-queue" role="figure" aria-labelledby="lv-queue-caption">
              <div className="lv-queue__head">
                <div className="lv-queue__patient">
                  <span className="lv-avatar" aria-hidden>
                    JP
                  </span>
                  <div>
                    <p className="lv-queue__name">Mr James Patel, 54</p>
                    <p className="lv-queue__meta">Type 2 diabetes · synthetic patient</p>
                  </div>
                </div>
                <span className="lv-tag lv-tag--violet">Review queue</span>
              </div>

              <ul className="lv-signals" aria-label="Signals from a synthetic patient, Mr J. Patel">
                {SIGNALS.map((s, i) => (
                  <li key={s.title} className="lv-signal lv-rise" style={{ ["--i" as string]: i }}>
                    <span className="lv-signal__title">{s.title}</span>
                    <span className="lv-signal__kind">
                      {s.kind}
                      {s.code ? <code>{s.code}</code> : null}
                    </span>
                    <span className={`lv-signal__state lv-status lv-status--${s.status}`}>
                      {CLINICAL_STATUS[s.status].label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="lv-decision">
                <p className="lv-decision__who">
                  <strong>Clinician decides</strong>
                  Drafts only until a named reviewer acts
                </p>
                <div className="lv-decision__btns" aria-hidden>
                  <span>Reject</span>
                  <span>Edit</span>
                  <span>Accept</span>
                </div>
              </div>
              <p id="lv-queue-caption" className="sr-only">
                Illustration of the Aksh review queue for a synthetic patient. Not a live record.
              </p>
            </div>

            <div className="lv-float lv-float--bottom lv-rise" style={{ ["--i" as string]: 6 }}>
              <span className="lv-float__icon" aria-hidden>
                <FileCheck2 className="h-4 w-4" />
              </span>
              <span>
                FHIR R4 staged after Accept
                <small>Not a live EHR write</small>
              </span>
            </div>

            <p className="lv-hero__footnote">Synthetic patient. Not a live record.</p>
          </div>
        </div>

        <ul className="lv-hero__trust" data-trust-strip aria-label="Product trust signals">
          {TRUST.map((t) => (
            <li key={t.title}>
              <strong>{t.title}</strong>
              <span>{t.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
