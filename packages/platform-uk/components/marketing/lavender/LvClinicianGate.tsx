import Link from "next/link";

const PILLARS = [
  { label: "Capture", detail: "Consult notes or voice become a structured draft" },
  { label: "Review", detail: "Documentation, safety and risk wait in one queue" },
  { label: "Govern", detail: "A named clinician accepts, edits or rejects" },
  { label: "Integrate", detail: "Accepted outputs stage as FHIR R4 · not a live EHR write" },
] as const;

export default function LvClinicianGate() {
  return (
    <section className="lv-section lv-section--flush" aria-labelledby="lv-gate-title" data-clinician-gate>
      <div className="lv-container lv-gate">
        <div className="lv-gate__copy">
          <p className="lv-eyebrow">Clinician control</p>
          <h2 id="lv-gate-title" className="lv-h2 mt-3">
            Every output is a draft until a named clinician decides.
          </h2>
          <ul className="lv-checklist">
            <li>Accept, edit or reject before anything can affect the record.</li>
            <li>Every decision is attributed to a named reviewer and audited.</li>
            <li>Missing data, like an overdue eye-screening date, is listed rather than guessed.</li>
            <li>No autonomous diagnosis, prescribing or treatment.</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/security" className="lv-btn lv-btn--ink">
              Security &amp; clinical safety
            </Link>
            <Link href="/demo/patel" className="lv-btn lv-btn--outline">
              Open Patel walkthrough
            </Link>
          </div>
        </div>

        <div className="lv-gate__panel">
          <p className="text-sm text-white/80">How it works</p>
          <ol className="grid gap-3">
            {PILLARS.map((p, i) => (
              <li key={p.label} className="lv-gate__step">
                <b aria-hidden>{i + 1}</b>
                <span>
                  <span className="block">{p.label}</span>
                  <small>{p.detail}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
