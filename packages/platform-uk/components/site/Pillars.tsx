import { AVAILABILITY_LABEL, FOUNDATIONS, OUTCOMES, PILLARS, type Availability } from "@/components/site/vision";

/** The two products on one foundation. Each lists what is available now, then what is in development. */
export function Pillars() {
  return (
    <div data-pillars>
      <div className="s-pillars">
        {PILLARS.map((p) => (
          <div key={p.key} className={`s-pillar s-pillar--${p.key}`}>
            <div className="s-pillar__head">
              <h3 className="s-h3" style={{ fontSize: 22 }}>{p.title}</h3>
              <p className="s-small">{p.subtitle}</p>
            </div>
            {(["available", "development"] as Availability[]).map((a) => {
              const items = p.items.filter((i) => i.availability === a);
              if (!items.length) return null;
              return (
                <div key={a} className="s-pillar__group" data-availability={a}>
                  <span className="s-pillar__label">{AVAILABILITY_LABEL[a]}</span>
                  <ul className="s-pillar__items">
                    {items.map((i) => (
                      <li key={i.name} className="s-pillar__item">
                        <span><b>{i.name}</b><small>{i.detail}</small></span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="s-foundations">
        <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>Shared foundations</h3><span className="s-small">Both products use the same sign-in, connections, consent and audit</span></div>
        <div className="s-foundations__grid">
          {FOUNDATIONS.map((f) => (
            <div key={f.name}><b style={{ fontSize: 14, color: "var(--s-ink)" }}>{f.name}</b><span className="s-small" style={{ fontSize: 13 }}>{f.detail}</span></div>
          ))}
        </div>
      </div>
      <div className="s-outcomes" aria-label="What Aksh is built to improve">
        {OUTCOMES.map((o) => <div key={o.name}><b>{o.name}</b><span>{o.detail}</span></div>)}
      </div>
    </div>
  );
}
