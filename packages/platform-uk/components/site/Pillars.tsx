import { FOUNDATIONS, OUTCOMES, PILLARS, STATUS_LABEL, type Status } from "@/components/site/vision";

const StatusPill = ({ s }: { s: Status }) => <span className={`s-status s-status--${s}`}>{STATUS_LABEL[s]}</span>;

/** The platform at a glance: two pillars, shared foundations, the outcomes they serve. Every item carries its status. */
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
            <ul className="s-pillar__items">
              {p.items.map((i) => (
                <li key={i.name} className="s-pillar__item">
                  <span><b>{i.name}</b><small>{i.detail}</small></span>
                  <StatusPill s={i.status} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="s-foundations">
        <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>Platform foundations (shared)</h3><span className="s-small">Role-based access to shared infrastructure and data</span></div>
        <div className="s-foundations__grid">
          {FOUNDATIONS.map((f) => (
            <div key={f.name}><b style={{ fontSize: 14, color: "var(--s-ink)" }}>{f.name}</b><span className="s-small" style={{ fontSize: 13 }}>{f.detail}</span><StatusPill s={f.status} /></div>
          ))}
        </div>
      </div>
      <div className="s-outcomes" aria-label="Outcomes the platform is built for">
        {OUTCOMES.map((o) => <div key={o.name}><b>{o.name}</b><span>{o.detail}</span></div>)}
      </div>
    </div>
  );
}
