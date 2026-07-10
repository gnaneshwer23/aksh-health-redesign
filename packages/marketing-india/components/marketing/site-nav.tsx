"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinks, site } from "@/content/india-marketing";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="product-nav">
      <Link className="product-brand" href="/">
        <span className="product-brand__mark" aria-hidden="true">
          +
        </span>
        <span className="product-brand__text">
          <strong>Aksh Health</strong>
          <small>{site.region}</small>
        </span>
      </Link>
      <div className="product-nav__actions">
        <nav aria-label="Primary" className="product-nav__links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "is-active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="product-button product-button--primary product-nav__cta" href="/for-partners">
          Book a demo
        </Link>
      </div>
    </header>
  );
}
