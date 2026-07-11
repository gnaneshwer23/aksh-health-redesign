"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  ["Platform", "/platform"],
  ["Docs", "/docs"],
] as const;

const solutionLinks = [
  ["Clinicians", "/for-clinicians"],
  ["Practices", "/for-practices"],
  ["Patients", "/for-patients"],
  ["Security", "/security"],
  ["Integrations", "/integrations"],
] as const;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
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

  const linkClass = cn(
    "text-sm font-medium transition-colors",
    scrolled ? "text-steel hover:text-navy" : "text-white/90 hover:text-white"
  );

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full overflow-x-hidden transition-all duration-200",
        scrolled ? "border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy shadow-sm">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-base font-bold leading-none text-navy">Aksh Health</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald">Healthcare OS</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map(([label, href]) => (
            <Link key={label} href={href} className={linkClass}>
              {label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className={cn("inline-flex items-center gap-1", linkClass)}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
            >
              Solutions
              <ChevronDown className={cn("h-4 w-4 transition-transform", solutionsOpen && "rotate-180")} />
            </button>
            {solutionsOpen && (
              <div className="absolute left-0 top-full z-50 min-w-[11rem] pt-2">
                <div className="rounded-xl border border-border-subtle bg-white py-2 shadow-lg">
                  {solutionLinks.map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="block px-4 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signin"
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              scrolled
                ? "border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white"
                : "border-white/50 text-white hover:border-white hover:bg-white/10"
            )}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-emerald px-5 py-2 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90"
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors md:hidden",
            scrolled
              ? "border-navy/20 text-navy hover:bg-navy/5"
              : "border-white/40 text-white hover:bg-white/10"
          )}
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
          className="flex w-[min(100vw,20rem)] flex-col border-l border-border-subtle bg-white p-0"
        >
          <div className="border-b border-border-subtle px-6 py-5">
            <p className="text-sm font-semibold text-navy">Menu</p>
            <p className="text-xs text-steel">Aksh Health Healthcare OS</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-4 py-4" aria-label="Mobile navigation">
            {navLinks.map(([label, href]) => (
              <SheetClose key={label} asChild>
                <Link
                  href={href}
                  className="rounded-xl px-4 py-3 text-base font-medium text-navy transition-colors hover:bg-navy/5"
                >
                  {label}
                </Link>
              </SheetClose>
            ))}

            <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-widest text-steel">Solutions</p>
            {solutionLinks.map(([label, href]) => (
              <SheetClose key={label} asChild>
                <Link
                  href={href}
                  className="rounded-xl px-4 py-3 text-base font-medium text-navy transition-colors hover:bg-navy/5"
                >
                  {label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle p-4">
            <SheetClose asChild>
              <Link
                href="/signin"
                className="rounded-xl border border-navy/20 px-4 py-3 text-center text-sm font-medium text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white"
              >
                Sign In
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/signup"
                className="rounded-xl bg-emerald px-4 py-3 text-center text-sm font-bold text-white shadow-card transition-all hover:bg-emerald/90"
              >
                Get Started
              </Link>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
