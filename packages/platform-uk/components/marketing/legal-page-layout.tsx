import type { ReactNode } from "react";

import { MarketingShell } from "@/components/marketing/MarketingShell";

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
    <MarketingShell editorial>
      <section className="owkin-page-hero border-b border-navy/[0.06] py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="owkin-roles__eyebrow">Legal</p>
          <h1 className="owkin-page-hero__title">{title}</h1>
          <p className="owkin-page-hero__lede">{description}</p>
          <p className="mt-3 text-sm text-slate/60">Last updated: {lastUpdated}</p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <article key={section.id ?? section.title} id={section.id}>
                <h2 className="font-[family-name:var(--font-marketing-display)] text-xl font-semibold tracking-tight text-navy-dark">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate/75">{section.content}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
