import Link from "next/link";
import type { ReactNode } from "react";

import { container, heroPrimaryCta, heroSecondaryCta } from "@/components/marketing/marketing-ui";

type Cta = { label: string; href: string };

type MarketingPageHeroProps = {
  eyebrow: string;
  title: string;
  lede: string;
  primary?: Cta;
  secondary?: Cta;
  children?: ReactNode;
  aside?: ReactNode;
};

/** Shared cream editorial hero for inner marketing pages. */
export function MarketingPageHero({
  eyebrow,
  title,
  lede,
  primary,
  secondary,
  children,
  aside,
}: MarketingPageHeroProps) {
  return (
    <section className="owkin-page-hero">
      <div className={`${container} owkin-page-hero__grid`}>
        <div className="owkin-page-hero__copy">
          <p className="owkin-roles__eyebrow">{eyebrow}</p>
          <h1 className="owkin-page-hero__title">{title}</h1>
          <p className="owkin-page-hero__lede">{lede}</p>
          {(primary || secondary) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {primary ? (
                <Link href={primary.href} className={`${heroPrimaryCta} sm:min-w-[11rem]`}>
                  {primary.label}
                </Link>
              ) : null}
              {secondary ? (
                <Link href={secondary.href} className={`${heroSecondaryCta} sm:min-w-[11rem]`}>
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          )}
          {children}
        </div>
        {aside ? <div className="owkin-page-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
}
