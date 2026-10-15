import type { ReactNode } from "react";

/** Inner-page header: copy on the left, an at-a-glance spec card on the right. */
export function PageHead({ eyebrow, title, lede, glance, children }: { eyebrow: string; title: string; lede: ReactNode; glance?: { title: string; rows: [string, ReactNode][] }; children?: ReactNode }) {
  return (
    <section className="s-page-head s-page-head--split">
      <div className="s-container s-page-head__inner" style={{ display: "grid" }}>
        <div className="s-page-head__copy">
          <span className="s-eyebrow">{eyebrow}</span>
          <h1 className="s-h1" style={{ fontSize: "clamp(36px, 4.4vw, 54px)" }}>{title}</h1>
          <p className="s-lede">{lede}</p>
          {children}
        </div>
        {glance ? (
          <aside className="s-glance" aria-label={glance.title}>
            <span className="s-glance__title">{glance.title}</span>
            <dl>
              {glance.rows.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

/** Sticky "on this page" tabs under the header. */
export function SubNav({ items }: { items: [string, string][] }) {
  return (
    <nav className="s-subnav" aria-label="On this page">
      <div className="s-container s-subnav__bar">
        {items.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </div>
    </nav>
  );
}

/** Numbered section title. */
export function SectionTitle({ n, eyebrow, title, lede }: { n?: string; eyebrow?: string; title: string; lede?: ReactNode }) {
  return (
    <div className="s-head">
      <div className="s-sectitle">{n ? <span className="s-num">{n}</span> : null}{eyebrow ? <span className="s-eyebrow">{eyebrow}</span> : null}</div>
      <h2 className="s-h2">{title}</h2>
      {lede ? <p className="s-lede">{lede}</p> : null}
    </div>
  );
}
