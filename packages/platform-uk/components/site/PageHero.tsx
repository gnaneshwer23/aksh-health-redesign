import type { ReactNode } from "react";

import { ProductCanvas, type CanvasModule } from "@/components/site/canvas/ProductCanvas";

/**
 * The one page opening used across the site: brand signal, headline, a short lede and actions,
 * then (on product pages) the same Aksh workspace canvas focused on that page's module.
 * Text-only pages use the same opening without the canvas.
 */
export function PageHero({
  title,
  lede,
  children,
  module,
  id,
  brand = true,
}: {
  title: ReactNode;
  lede: ReactNode;
  children?: ReactNode;
  module?: CanvasModule;
  id?: string;
  /** Hero-level brand mark (not only nav). Default on for brand-first composition. */
  brand?: boolean;
}) {
  return (
    <section className="s-hero2" data-hero id={id} data-has-canvas={module ? "true" : "false"}>
      <div className="s-hero2__wash" aria-hidden />
      <div className="s-hero2__grid" aria-hidden />
      <div className="s-container">
        <div className="s-hero2__copy">
          <div className="s-hero2__lead">
            {brand ? (
              <p className="s-hero2__brand s-reveal" aria-label="Aksh Health">
                <span className="s-brand__mark" aria-hidden>
                  A
                </span>
                <span className="s-hero2__brand-name">Aksh</span>
              </p>
            ) : null}
            <h1 className="s-h1 s-reveal" style={{ animationDelay: "40ms" }}>
              {title}
            </h1>
          </div>
          <div className="s-hero2__side s-reveal" style={{ animationDelay: "140ms" }}>
            <p className="s-lede">{lede}</p>
            {children}
          </div>
        </div>
        {module ? (
          <div className="s-hero2__canvas s-reveal" style={{ animationDelay: "260ms" }}>
            <ProductCanvas module={module} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
