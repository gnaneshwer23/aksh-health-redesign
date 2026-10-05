"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const centerLinks = [
  { label: "Platform", href: "/platform" },
  { label: "Solutions", href: "/solutions" },
  { label: "Safety & Trust", href: "/security" },
  { label: "Resources", href: "/resources" },
] as const;

type NavbarProps = {
  overDarkHero?: boolean;
  overLightHero?: boolean;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--owkin-accent)] focus-visible:ring-offset-2";

export default function Navbar({ overDarkHero = false, overLightHero = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  const transparentOverDark = overDarkHero && !scrolled;
  const transparentOverLight = overLightHero && !scrolled;
  const useSolidNav = scrolled || (!overDarkHero && !overLightHero);

  return (
    <nav
      data-over-dark-hero={transparentOverDark ? "true" : "false"}
      data-over-light-hero={transparentOverLight ? "true" : "false"}
      data-solid-navbar={useSolidNav ? "true" : "false"}
      className={cn(
        "owkin-nav fixed top-0 z-50 w-full transition-colors duration-200",
        useSolidNav ? "owkin-nav--solid" : "owkin-nav--transparent"
      )}
    >
      <div className="owkin-nav__bar mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className={cn("owkin-nav__brand", focusRing)}>
          <span className="owkin-nav__mark" aria-hidden>
            A
          </span>
          <span className="owkin-nav__wordmark">Aksh Health</span>
        </Link>

        <div className="owkin-nav__center hidden lg:flex" aria-label="Primary">
          {centerLinks.map((item) => (
            <Link key={item.label} href={item.href} className={cn("owkin-nav__link", focusRing)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/demo/patel" className={cn("owkin-nav__ghost-link", focusRing)}>
            See Demo
          </Link>
          <Link href="/get-started" className={cn("owkin-nav__pill", focusRing)}>
            Request Pilot
          </Link>
        </div>

        <button
          type="button"
          className={cn("owkin-nav__mobile-toggle lg:hidden", focusRing)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="mobile-nav-menu"
          side="right"
          className="flex w-[min(100vw,22rem)] flex-col border-l border-black/5 bg-[var(--owkin-cream)] p-0"
        >
          <div className="border-b border-black/5 px-6 py-5">
            <p className="text-sm font-medium text-[var(--owkin-ink)]">Menu</p>
            <p className="text-xs text-black/50">Aksh Health</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation">
            {centerLinks.map((item) => (
              <SheetClose key={item.label} asChild>
                <Link
                  href={item.href}
                  className={cn("rounded-xl px-4 py-3 text-base font-medium text-[var(--owkin-ink)]", focusRing)}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-black/5 p-4">
            <SheetClose asChild>
              <Link href="/demo/patel" className={cn("owkin-nav__ghost-link text-center", focusRing)}>
                See Demo
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/get-started" className={cn("owkin-nav__pill text-center", focusRing)}>
                Request Pilot
              </Link>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
