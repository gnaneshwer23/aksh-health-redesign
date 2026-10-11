import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GUIDES } from "@/components/site/guides";
import { SiteShell } from "@/components/site/SiteShell";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? { title: g.title, description: g.summary } : {};
}

export default async function GuidePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const index = GUIDES.findIndex((x) => x.slug === slug);
  const guide = GUIDES[index];
  if (!guide) notFound();
  const next = GUIDES[index + 1];
  return (
    <SiteShell>
      <section className="s-page-head">
        <div className="s-container s-page-head__inner">
          <Link href="/resources" className="s-link" style={{ fontSize: 14 }}>← Resources</Link>
          <h1 className="s-h1" style={{ fontSize: "clamp(32px, 4vw, 48px)" }}>{guide.title}</h1>
          <p className="s-lede">{guide.summary}</p>
        </div>
      </section>
      <section className="s-section s-section--tight">
        <div className="s-container s-doc">
          <nav className="s-doc__nav" aria-label="Guides">
            <span className="s-doc__nav-title">Guides</span>
            {GUIDES.map((g) => (
              <Link key={g.slug} href={`/resources/${g.slug}`} aria-current={g.slug === slug ? "page" : undefined}>{g.title}</Link>
            ))}
          </nav>
          <article className="s-prose" data-guide={guide.slug}>
            {guide.body}
            {next ? (
              <p style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--s-line)" }}>
                Next: <Link href={`/resources/${next.slug}`}>{next.title}</Link>
              </p>
            ) : null}
          </article>
        </div>
      </section>
    </SiteShell>
  );
}
