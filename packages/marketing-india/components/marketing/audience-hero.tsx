import Link from "next/link";

import type { HeroContent } from "@/content/india-marketing";

import { HeroVisual } from "./hero-visual";

export function AudienceHero({ hero, showVisual = true }: { hero: HeroContent; showVisual?: boolean }) {
  return (
    <section className="product-hero product-hero--split">
      <div className="product-hero__copy">
        <p className="product-kicker">{hero.kicker}</p>
        <h1>{hero.title}</h1>
        <p>{hero.description}</p>
        <div className="pill-row product-pill-row">
          {hero.pills.map((pill) => (
            <span className="pill" key={pill}>
              {pill}
            </span>
          ))}
        </div>
        <div className="product-actions">
          {hero.actions.map((action) => (
            <Link
              key={action.label}
              className={`product-button product-button--${action.variant}`}
              href={action.href}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {showVisual ? (
        <div className="product-hero-stack">
          <HeroVisual />
        </div>
      ) : null}
    </section>
  );
}
