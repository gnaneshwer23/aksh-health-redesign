"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const primaryNavLinks = [
  { label: "Product", href: "/platform" },
  { label: "Clinicians", href: "/for-clinicians" },
  { label: "Administrators", href: "/for-administrators" },
  { label: "Organisations", href: "/get-started" },
  { label: "Docs", href: "/docs" },
] as const;

const secondaryNavLinks = [
  { label: "Roles", href: "/onboarding" },
  { label: "Clinician Dashboard", href: "/dashboard/gp" },
  { label: "Demo", href: "/demo" },
] as const;

const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navSurface = scrolled || menuOpen;

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-200",
        navSurface ? "border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur-md" : "border-b border-transparent bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setMenuOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy shadow-sm">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold leading-none text-navy">Aksh Health</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald">Clinical AI</span>
          </div>
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-steel transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 xl:flex">
          {secondaryNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-steel transition-colors hover:text-navy"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/signin"
            className="hidden rounded-xl border border-navy/20 px-4 py-2 text-sm font-medium text-navy transition-all hover:border-navy hover:bg-navy hover:text-white md:block"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="hidden rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-navy/90 sm:inline-block"
          >
            Open app
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-navy lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav-menu"
          className="border-t border-border bg-white px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {allNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm font-medium text-navy hover:bg-surface"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signin"
              className="rounded-lg px-3 py-3 text-sm font-medium text-steel hover:bg-surface"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="mt-2 rounded-xl bg-navy px-4 py-3 text-center text-sm font-bold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Open app
            </Link>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
