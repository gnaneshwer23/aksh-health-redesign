import Link from "next/link";

import type { CtaBand } from "@/content/india-marketing";

export function CtaBand({ cta }: { cta: CtaBand }) {
  return (
    <section className="product-cta" aria-label="Call to action">
      <div>
        <p className="product-kicker">{cta.kicker}</p>
        <h2>{cta.title}</h2>
        <p>{cta.description}</p>
      </div>
      <div className="product-actions">
        {cta.actions.map((action) => (
          <Link
            key={action.label}
            className={`product-button product-button--${action.variant}`}
            href={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
