import Link from "next/link";

type Cta = { label: string; href: string };

type LvCtaBandProps = {
  eyebrow?: string;
  title: string;
  lede?: string;
  primary: Cta;
  secondary?: Cta;
};

export default function LvCtaBand({ eyebrow, title, lede, primary, secondary }: LvCtaBandProps) {
  return (
    <section className="lv-cta" data-cta-band>
      <div className="lv-cta__card">
        <svg className="lv-cta__mark" viewBox="0 0 100 100" aria-hidden>
          <g stroke="currentColor" strokeWidth="9" strokeLinecap="round">
            <line x1="50" y1="8" x2="50" y2="92" />
            <line x1="13.6" y1="29" x2="86.4" y2="71" />
            <line x1="13.6" y1="71" x2="86.4" y2="29" />
          </g>
        </svg>
        {eyebrow ? <p className="lv-cta__eyebrow">{eyebrow}</p> : null}
        <h2 className="lv-cta__title">{title}</h2>
        {lede ? <p className="lv-cta__lede">{lede}</p> : null}
        <div className="lv-cta__actions">
          <Link href={primary.href} className="lv-btn lv-btn--white">
            {primary.label}
          </Link>
          {secondary ? (
            <Link href={secondary.href} className="lv-btn lv-btn--glass">
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
