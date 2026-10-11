import type { ReactNode } from "react";

import { SiteShell } from "@/components/site/SiteShell";

export type LegalSection = {
  id?: string;
  title: string;
  content: ReactNode;
};

export type LegalPageLayoutProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export function LegalPageLayout({ title, description, lastUpdated, sections }: LegalPageLayoutProps) {
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <span className="s-eyebrow">Legal</span>
          <h1 className="s-h1" style={{ fontSize: "clamp(34px, 4.2vw, 48px)" }}>{title}</h1>
          <p className="s-lede">{description}</p>
          <p className="s-small">Last updated: {lastUpdated}</p>
        </div>
      </section>
      <section className="s-section s-section--tight">
        <div className="s-container s-doc">
          <nav className="s-doc__nav" aria-label="Sections">
            <span className="s-doc__nav-title">Contents</span>
            {sections.map((s, i) => (
              <a key={s.id ?? s.title} href={`#${s.id ?? `section-${i + 1}`}`}>{s.title}</a>
            ))}
          </nav>
          <div className="s-prose">
            {sections.map((section, i) => (
              <section key={section.id ?? section.title} id={section.id ?? `section-${i + 1}`} style={{ scrollMarginTop: 96 }}>
                <h2>{section.title}</h2>
                <div style={{ display: "grid", gap: 14, marginTop: 14 }}>{section.content}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
