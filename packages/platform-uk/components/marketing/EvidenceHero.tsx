import Link from "next/link";

import { CLINICAL_STATUS, type ClinicalStatus } from "@/components/marketing/clinical-status";

import styles from "./EvidenceHero.module.css";

type Signal = {
  title: string;
  kind: string;
  code?: string;
  status: ClinicalStatus;
  slot: string; // desktop position, see .slot-* in the CSS module
};

// Canonical synthetic patient. Keep these values identical to /demo/patel.
const SIGNALS: Signal[] = [
  { title: "HbA1c 72 mmol/mol", kind: "Lab result", code: "LOINC 59261-8", status: "needs-review", slot: "a" },
  { title: "Apixaban with aspirin", kind: "Interaction check", status: "held", slot: "b" },
  { title: "Diabetes review, 28 Sep", kind: "Appointment missed", status: "needs-review", slot: "c" },
  { title: "HbA1c “about 60”", kind: "Patient-reported, phone intake", status: "unverified", slot: "d" },
  { title: "Eye screening", kind: "Last done June 2025", status: "needs-review", slot: "e" },
  { title: "Medication review booked", kind: "Dr S. Williams, 10:42", status: "approved", slot: "f" },
];

export default function EvidenceHero() {
  return (
    <section className={styles.root} aria-labelledby="evidence-hero-title">
      <div className={styles.stage}>
        <div className={styles.copy}>
          <h1 id="evidence-hero-title" className={styles.title}>
            <span>Diabetes care produces signals every week.</span>{" "}
            <span className={styles.titleSecond}>Nobody sees them together until the review.</span>
          </h1>
          <p className={styles.lede}>
            Aksh gathers labs, medicines, missed appointments and what patients report into one review queue. Each
            signal keeps its source, and nothing reaches the record until a named clinician decides.
          </p>
          <div className={styles.actions}>
            <Link href="/demo/patel" className={styles.primary}>
              Walk through Mr Patel’s case
            </Link>
            <Link href="/get-started" className={styles.secondary}>
              Request a pilot
            </Link>
          </div>
        </div>

        <ul className={styles.signals} aria-label="Signals from a synthetic patient, Mr J. Patel">
          {SIGNALS.map((s, i) => (
            <li
              key={s.title}
              className={`${styles.signal} ${styles[`slot-${s.slot}`]} ${styles[`is-${s.status}`]}`}
              style={{ ["--i" as string]: i }}
            >
              <span className={styles.signalTitle}>{s.title}</span>
              <span className={styles.signalKind}>
                {s.kind}
                {s.code ? <span className={styles.code}>{s.code}</span> : null}
              </span>
              <span className={styles.state}>{CLINICAL_STATUS[s.status].label}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className={styles.legend}>
        {(Object.keys(CLINICAL_STATUS) as ClinicalStatus[]).map((k) => (
          <div key={k} className={`${styles.legendItem} ${styles[`is-${k}`]}`}>
            <dt className={styles.state}>{CLINICAL_STATUS[k].label}</dt>
            <dd>{CLINICAL_STATUS[k].description}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.footnote}>Synthetic patient. Not a live record.</p>
    </section>
  );
}
