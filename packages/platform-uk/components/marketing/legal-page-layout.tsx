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
    <MarketingShell>
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-navy">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-steel">{description}</p>
          <p className="mt-2 text-sm text-muted">Last updated: {lastUpdated}</p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <article key={section.id ?? section.title} id={section.id}>
                <h2 className="text-xl font-bold text-navy">{section.title}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-steel">{section.content}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
