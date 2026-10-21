import type { ReactNode } from "react";

import { ProductCanvas, type CanvasModule } from "@/components/site/canvas/ProductCanvas";

/**
 * The one page opening used across the site: headline, a short lede and actions, then (on product pages) the same
 * Aksh workspace canvas focused on that page's module. Text-only pages use the same opening without the canvas.
 */
export function PageHero({ title, lede, children, module, id }: { title: ReactNode; lede: ReactNode; children?: ReactNode; module?: CanvasModule; id?: string }) {
  return (
    <section className="s-hero2" data-hero id={id}>
      <div className="s-container">
        <div className="s-hero2__copy">
          <h1 className="s-h1">{title}</h1>
          <div className="s-hero2__side">
            <p className="s-lede">{lede}</p>
            {children}
          </div>
        </div>
        {module ? <ProductCanvas module={module} /> : null}
      </div>
    </section>
  );
}
