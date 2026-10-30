"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export const SITE_LINKS = [
  { label: "How it works", href: "/platform" },
  { label: "Available now", href: "/product" },
  { label: "Demo", href: "/demo" },
  { label: "AI agents", href: "/agents" },
  { label: "Security", href: "/security" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <header className="s-nav" data-scrolled={scrolled ? "true" : "false"} data-site-nav>
      <div className="s-container">
        <div className="s-nav__bar">
          <Link href="/" className="s-brand" aria-label="Aksh Health home">
            <span className="s-brand__mark" aria-hidden>A</span>
            Aksh Health
          </Link>
          <nav className="s-nav__links" aria-label="Site">
            {SITE_LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={current(l.href)}>{l.label}</Link>
            ))}
          </nav>
          <div className="s-nav__right">
            <Link href="/signin" className="s-nav__signin">Sign in</Link>
            <Link href="/get-started" className="s-btn s-btn--primary s-btn--sm">Request a pilot</Link>
          </div>
          <button type="button" className="s-nav__menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <div className="s-nav__panel" data-open={open ? "true" : "false"}>
          {SITE_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
          <div className="s-actions">
            <Link href="/get-started" className="s-btn s-btn--primary">Request a pilot</Link>
            <Link href="/signin" className="s-btn s-btn--ghost">Sign in</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
