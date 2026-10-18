import { FOUNDATIONS, PILLARS } from "@/components/site/vision";
import { StatusLegend, StatusPill } from "@/components/site/StatusPill";

/** The two products on one foundation; every item shows its status from the capability register. */
export function Pillars() {
  return (
    <div data-pillars>
      <StatusLegend />
      <div className="s-pillars" style={{ marginTop: 14 }}>
        {PILLARS.map((p) => (
          <div key={p.key} className={`s-pillar s-pillar--${p.key}`}>
            <div className="s-pillar__head">
              <h3 className="s-h3" style={{ fontSize: 22 }}>{p.title}</h3>
              <p className="s-small">{p.subtitle}</p>
            </div>
            <ul className="s-pillar__items">
              {p.items.map((i) => (
                <li key={i.id} className="s-pillar__item" data-status={i.status}>
                  <span><b>{i.name}</b><small>{i.detail}</small></span>
                  <StatusPill s={i.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="s-foundations">
        <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>Shared foundations</h3><span className="s-small">Used by everything above</span></div>
        <div className="s-foundations__grid">
          {FOUNDATIONS.map((f) => (
            <div key={f.id}><b style={{ fontSize: 14, color: "var(--s-ink)" }}>{f.name}</b><span className="s-small" style={{ fontSize: 13 }}>{f.detail}</span><StatusPill s={f.status} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}
