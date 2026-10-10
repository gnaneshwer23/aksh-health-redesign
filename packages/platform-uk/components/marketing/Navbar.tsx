"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Asterisk, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const centerLinks = [
  { label: "Platform", href: "/platform" },
  { label: "Aksh Diabetes", href: "/platform#diabetes" },
  { label: "Safety & Trust", href: "/security" },
  { label: "Resources", href: "/resources" },
] as const;

type NavbarProps = {
  /** Kept for MarketingShell compatibility; the floating pill bar reads on any hero. */
  overDarkHero?: boolean;
  overLightHero?: boolean;
};

export default function Navbar(_props: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="lv-nav" data-site-nav data-scrolled={scrolled ? "true" : "false"} aria-label="Site">
      <div className="lv-nav__bar">
        <Link href="/" className="lv-nav__brand lv-focus" aria-label="Aksh Health home">
          <span className="lv-nav__mark" aria-hidden>
            <Asterisk className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="lv-nav__wordmark">Aksh Health</span>
        </Link>

        <div className="lv-nav__center hidden lg:flex" data-nav-center>
          {centerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className="lv-nav__link lv-focus"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          <Link href="/demo/patel" className="lv-nav__ghost lv-focus">
            See Demo
          </Link>
          <Link href="/get-started" className="lv-btn lv-btn--ink">
            Request Pilot
          </Link>
        </div>

        <button
          type="button"
          className="lv-nav__toggle lv-focus lg:hidden"
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
          className="flex w-[min(100vw,22rem)] flex-col border-l border-black/5 bg-[#f7f7fb] p-0"
        >
          <div className="border-b border-black/5 px-6 py-5">
            <p className="text-sm font-medium text-[#0e0d1f]">Menu</p>
            <p className="text-xs text-black/50">Aksh Health</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation">
            {centerLinks.map((item) => (
              <SheetClose key={item.label} asChild>
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="lv-focus rounded-xl px-4 py-3 text-base font-medium text-[#0e0d1f] hover:bg-[#efeff5]"
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-black/5 p-4">
            <SheetClose asChild>
              <Link href="/demo/patel" className="lv-btn lv-btn--outline">
                See Demo
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/get-started" className="lv-btn lv-btn--ink">
                Request Pilot
              </Link>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
