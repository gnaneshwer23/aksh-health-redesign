import { PLATFORM_LAYERS } from "@/components/marketing/lavender/vision-content";

export default function LvLayers() {
  return (
    <section className="lv-section" aria-labelledby="lv-layers-title" data-section="layers">
      <div className="lv-container lv-layers-wrap">
        <div>
          <p className="lv-eyebrow">The Aksh Intelligence Platform</p>
          <h2 id="lv-layers-title" className="lv-h2 mt-3">
            One platform. Disease modules plug in.
          </h2>
          <p className="lv-lede mt-5">
            Diabetes is the first module proving the pattern, not a lock-in. Population, patient and clinician views
            read the same signal, and the whole stack sits beside the EHR, which stays the system of record.
          </p>
        </div>

        <ol className="lv-layers" aria-label="Platform layers, top to bottom">
          {PLATFORM_LAYERS.map((l, i) => (
            <li key={l.name} className="lv-layer" style={{ ["--i" as string]: i }}>
              <span className="lv-layer__name">{l.name}</span>
              <span className="lv-layer__detail">{l.detail}</span>
            </li>
          ))}
          <li className="lv-layer lv-layer--ehr">
            <span className="lv-layer__name">Your EHR</span>
            <span className="lv-layer__detail">System of record. No live write until a separately governed Track B.</span>
          </li>
        </ol>
      </div>
    </section>
  );
}
