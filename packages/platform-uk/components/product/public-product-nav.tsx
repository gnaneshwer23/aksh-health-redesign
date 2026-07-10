import Link from "next/link";

export function PublicProductNav({
  ctaHref = "/workspace",
  ctaLabel = "Open app"
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <header className="product-nav">
      <Link className="product-brand" href="/">
        <span>Aksh</span> Health
      </Link>
      <div className="product-nav__actions">
        <nav aria-label="Public product navigation" className="product-nav__links">
          <Link href="/">Product</Link>
          <Link href="/for-clinicians">Clinicians</Link>
          <Link href="/for-administrators">Administrators</Link>
          <Link href="/pilot">Pilot</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/onboarding">Roles</Link>
          <Link href="/dashboard/gp">Clinician Dashboard</Link>
          <Link href="/demo">Demo</Link>
        </nav>
        <Link className="product-button product-button--secondary product-nav__cta" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}