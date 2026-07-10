import { SiteNav } from "@/components/marketing/site-nav";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="product-page">
      <div className="product-bg">
        <div className="product-bg__orb product-bg__orb--one" aria-hidden="true" />
        <div className="product-bg__orb product-bg__orb--two" aria-hidden="true" />
      </div>
      <div className="product-nav-wrap">
        <SiteNav />
      </div>
      {children}
    </main>
  );
}
