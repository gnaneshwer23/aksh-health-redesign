import { PRODUCT_LOOP } from "@/components/marketing/lavender/vision-content";

export default function LvLoop({ flush = false }: { flush?: boolean }) {
  return (
    <section
      className={`lv-section${flush ? " lv-section--flush" : ""}`}
      aria-labelledby="lv-loop-title"
      data-section="loop"
    >
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">End-to-end loop</p>
            <h2 id="lv-loop-title" className="lv-h2 mt-3">
              From signal to governed learning.
            </h2>
          </div>
          <p className="lv-lede">
            Every step is a named agent with a defined boundary. The clinician decision sits in the middle, and nothing
            after it writes to a live record.
          </p>
        </div>

        <ol className="lv-loop" tabIndex={0} aria-label="Loop steps">
          {PRODUCT_LOOP.map((s, i) => (
            <li key={s.step} className={`lv-loop__step${s.step === "Clinician decides" ? " is-human" : ""}`}>
              <span className="lv-card__num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="lv-loop__title">{s.step}</h3>
              <p className="lv-loop__detail">{s.detail}</p>
              <p className="lv-loop__agents">{s.agents}</p>
            </li>
          ))}
        </ol>
        <p className="lv-swipe-hint" aria-hidden>Swipe to see all nine →</p>
      </div>
    </section>
  );
}
