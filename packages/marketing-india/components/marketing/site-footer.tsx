import Link from "next/link";

import { navLinks, site } from "@/content/india-marketing";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__grid">
        <div>
          <strong className="site-footer__brand">
            {site.name} · {site.region}
          </strong>
          <p>{site.proofNotice}</p>
        </div>
        <div>
          <span className="site-footer__label">Explore</span>
          <nav aria-label="Footer">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <span className="site-footer__label">Contact</span>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </div>
      </div>
      <p className="site-footer__legal">© {new Date().getFullYear()} Aksh Health. Synthetic-safe proof environment.</p>
    </footer>
  );
}
