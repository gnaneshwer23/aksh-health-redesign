import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { MarketingPageHero } from "@/components/marketing/MarketingPageHero";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import TrustStrip from "@/components/marketing/TrustStrip";
import LvCtaBand from "@/components/marketing/lavender/LvCtaBand";
import { AUDIENCE_PAGES, type AudienceKey } from "@/components/marketing/lavender/audience-pages";

export default function LvAudiencePage({ audience }: { audience: AudienceKey }) {
  const page = AUDIENCE_PAGES[audience];
  const others = Object.values(AUDIENCE_PAGES).filter((p) => p.key !== audience);

  return (
    <MarketingShell editorial>
      <MarketingPageHero
        eyebrow={page.eyebrow}
        title={page.title}
        lede={page.lede}
        primary={page.primary}
        secondary={page.secondary}
        aside={
          <figure className="lv-scenario" aria-labelledby={`lv-scenario-${page.key}`}>
            <figcaption id={`lv-scenario-${page.key}`} className="lv-scenario__head">
              {page.scenario.heading}
            </figcaption>
            <ol className="lv-scenario__steps">
              {page.scenario.steps.map((s) => (
                <li key={s.time + s.text}>
                  <span className="lv-scenario__time">{s.time}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            <p className="lv-scenario__note">Synthetic people and data. Not a live record.</p>
          </figure>
        }
      />

      <TrustStrip />

      <section className="lv-section" aria-labelledby="lv-gets-title" data-section="audience-gets">
        <div className="lv-container">
          <div className="lv-section-head">
            <div>
              <p className="lv-eyebrow">What you get</p>
              <h2 id="lv-gets-title" className="lv-h2 mt-3">
                Prepared work. Your decision.
              </h2>
            </div>
            <p className="lv-lede">
              Every capability runs on the same orchestrator, review queue and audit trail as the rest of Aksh.
            </p>
          </div>
          <ul className="lv-aud">
            {page.gets.map((g) => {
              const Icon = g.icon;
              return (
                <li key={g.title} className="lv-aud__card">
                  <span className="lv-aud__icon" aria-hidden>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="lv-aud__who">{g.title}</h3>
                  <p className="lv-aud__need">{g.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="lv-section lv-section--flush" aria-labelledby="lv-bounds-title">
        <div className="lv-container lv-bounds">
          <div>
            <p className="lv-eyebrow">What stays with people</p>
            <h2 id="lv-bounds-title" className="lv-h2 mt-3">
              Clear limits, enforced on the server.
            </h2>
          </div>
          <ul className="lv-checklist">
            {page.boundaries.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lv-section" aria-labelledby="lv-try-title" data-section="audience-try">
        <div className="lv-container">
          <p className="lv-eyebrow">Try it now</p>
          <h2 id="lv-try-title" className="lv-h2 mt-3">
            Open the synthetic demo.
          </h2>
          <ul className="lv-try mt-8">
            {page.tryIt.map((t) => (
              <li key={t.href + t.label}>
                <Link href={t.href} className="lv-try__link lv-focus">
                  <span>
                    <span className="lv-try__label">{t.label}</span>
                    <span className="lv-try__note">{t.note}</span>
                  </span>
                  <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          <nav className="lv-others mt-12" aria-label="Other audiences">
            <span className="lv-others__label">Also for</span>
            {others.map((o) => (
              <Link key={o.key} href={o.path} className="lv-btn lv-btn--outline">
                {o.metaTitle.replace(/^For /, "").replace(/^./, (c) => c.toUpperCase())}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <LvCtaBand
        eyebrow="Start with a controlled use case"
        title="One diabetes workflow first. Expand on evidence."
        lede="Pilots start on synthetic data, with your reviewers and your governance boundaries."
        primary={{ label: "Request a Pilot", href: "/get-started" }}
        secondary={{ label: "Open the Patel Walkthrough", href: "/demo/patel" }}
      />
    </MarketingShell>
  );
}
