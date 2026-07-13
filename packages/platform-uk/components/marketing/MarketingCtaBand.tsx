import Link from "next/link";

import { container, sectionTight } from "@/components/marketing/marketing-ui";

type Cta = { label: string; href: string };

type MarketingCtaBandProps = {
  title: string;
  lede?: string;
  primary: Cta;
  secondary?: Cta;
};

/** Dark Owkin CTA band — keeps hero/CTA contrast fix from cream editorial pages. */
export function MarketingCtaBand({ title, lede, primary, secondary }: MarketingCtaBandProps) {
  return (
    <section className={`owkin-cta-band ${sectionTight} text-center`} data-cta-band>
      <div className={`${container} max-w-2xl`}>
        <h2 className="owkin-display owkin-cta-band__title mb-4 text-3xl md:text-4xl">{title}</h2>
        {lede ? <p className="owkin-cta-band__lede mb-10 text-lg leading-relaxed md:text-xl">{lede}</p> : null}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link href={primary.href} className="owkin-cta-band__btn">
            {primary.label}
          </Link>
          {secondary ? (
            <Link href={secondary.href} className="owkin-cta-band__link">
              {secondary.label}
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
