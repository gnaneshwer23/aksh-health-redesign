import type { ReactNode } from "react";

import "@/app/site.css";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
