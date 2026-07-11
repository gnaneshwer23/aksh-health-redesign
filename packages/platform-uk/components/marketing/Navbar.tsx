"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
  ["Platform", "/platform"],
  ["Resources", "/resources"],
] as const;

const solutionGroups = [
  {
    label: "Clinicians & practices",
    href: "/for-clinicians",
    description: "GPs, nurses, pharmacists, and practice managers",
  },
  {
    label: "Hospitals & ICS",
    href: "/for-hospitals",
    description: "Trust executives, operational leads, and ICS population health",
  },
  {
    label: "Pharma & research",
    href: "/for-research",
    description: "Clinical informatics, outcome evaluation, and governed data access",
  },
  {
    label: "Patients & carers",
    href: "/for-patients",
    description: "Health companion and support between appointments",
  },
] as const;

type NavbarProps = {
  /** Transparent navbar sits over a dark navy hero at page top */
  overDarkHero?: boolean;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2";

export default function Navbar({ overDarkHero = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSolutionsOpen, setMobileSolutionsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const solutionsMenuId = useId();
  const solutionsButtonRef = useRef<HTMLButtonElement>(null);
  const solutionsPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!solutionsOpen) return;

    const panel = solutionsPanelRef.current;
    if (!panel) return;

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSolutionsOpen(false);
        solutionsButtonRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [solutionsOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    setMobileSolutionsOpen(false);
  }, [mobileOpen]);

  const transparentOverHero = overDarkHero && !scrolled;
  const useLightNav = scrolled || !overDarkHero;

  const linkClass = cn(
    "text-sm font-medium transition-colors rounded-lg",
    focusRing,
    transparentOverHero ? "text-white/90 hover:text-white" : "text-steel hover:text-navy"
  );

  return (
    <nav
      data-over-dark-hero={transparentOverHero ? "true" : "false"}
      data-solid-navbar={useLightNav ? "true" : "false"}
      className={cn(
        "fixed top-0 z-50 w-full overflow-visible transition-all duration-200",
        useLightNav
          ? "border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className={cn("navbar-brand flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl transition-colors", focusRing)}
          style={{ color: transparentOverHero ? "#ffffff" : "#003D7A" }}
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-sm",
              transparentOverHero ? "border border-white/40 bg-white/20 backdrop-blur-sm" : "bg-navy"
            )}
          >
            <span
              className="text-sm font-bold"
              style={{ color: transparentOverHero ? "#003D7A" : "#ffffff" }}
            >
              A
            </span>
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span
              className="navbar-brand-title truncate text-base font-bold leading-none"
              style={{ color: transparentOverHero ? "#ffffff" : "#003D7A" }}
            >
              Aksh Health
            </span>
            <span
              className="navbar-brand-subtitle text-xs font-semibold uppercase tracking-wide"
              style={{ color: transparentOverHero ? "#00A86B" : "#006B4F" }}
            >
              Healthcare OS
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.slice(0, 1).map(([label, href]) => (
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
              ref={solutionsButtonRef}
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border-0 bg-transparent p-0 shadow-none",
                linkClass
              )}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
              aria-controls={solutionsMenuId}
              onClick={() => setSolutionsOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSolutionsOpen((open) => !open);
                }
                if (event.key === "Escape") {
                  setSolutionsOpen(false);
                }
              }}
            >
              Solutions
              <ChevronDown className={cn("h-4 w-4 transition-transform", solutionsOpen && "rotate-180")} />
            </button>
            {solutionsOpen ? (
              <div
                id={solutionsMenuId}
                ref={solutionsPanelRef}
                role="menu"
                className="absolute left-0 top-full z-50 min-w-[18rem] pt-2"
              >
                <div className="rounded-xl border border-border-subtle bg-white py-2 shadow-lg">
                  {solutionGroups.map((group) => (
                    <Link
                      key={group.label}
                      href={group.href}
                      role="menuitem"
                      className={cn(
                        "block px-4 py-2.5 transition-colors hover:bg-navy/5",
                        focusRing
                      )}
                      onClick={() => setSolutionsOpen(false)}
                    >
                      <span className="block text-sm font-semibold text-navy">{group.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-steel">{group.description}</span>
                    </Link>
                  ))}
                  <div className="my-1 border-t border-border-subtle" />
                  <Link
                    href="/platform#roles"
                    role="menuitem"
                    className={cn(
                      "block px-4 py-2.5 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/5",
                      focusRing
                    )}
                    onClick={() => setSolutionsOpen(false)}
                  >
                    View all roles
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {navLinks.slice(1).map(([label, href]) => (
            <Link key={label} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/signin"
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              focusRing,
              transparentOverHero
                ? "border-white/50 text-white hover:border-white hover:bg-white/10"
                : "border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white"
            )}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(
              "rounded-xl bg-emerald px-5 py-2 text-sm font-bold text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-emerald/90",
              focusRing
            )}
          >
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors md:hidden",
            focusRing,
            transparentOverHero
              ? "border-white/40 text-white hover:bg-white/10"
              : "border-navy/20 text-navy hover:bg-navy/5"
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
            <SheetClose asChild>
              <Link
                href="/platform"
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium text-navy transition-colors hover:bg-navy/5",
                  focusRing
                )}
              >
                Platform
              </Link>
            </SheetClose>

            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-navy transition-colors hover:bg-navy/5",
                focusRing
              )}
              aria-expanded={mobileSolutionsOpen}
              onClick={() => setMobileSolutionsOpen((open) => !open)}
            >
              Solutions
              <ChevronDown className={cn("h-4 w-4 transition-transform", mobileSolutionsOpen && "rotate-180")} />
            </button>

            {mobileSolutionsOpen ? (
              <div className="ml-2 flex flex-col gap-1 border-l border-border-subtle pl-3">
                {solutionGroups.map((group) => (
                  <SheetClose key={group.label} asChild>
                    <Link
                      href={group.href}
                      className={cn(
                        "rounded-xl px-4 py-2.5 text-sm text-navy transition-colors hover:bg-navy/5",
                        focusRing
                      )}
                    >
                      <span className="block font-semibold">{group.label}</span>
                      <span className="mt-0.5 block text-xs text-steel">{group.description}</span>
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link
                    href="/platform#roles"
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald transition-colors hover:bg-emerald/5",
                      focusRing
                    )}
                  >
                    View all roles
                  </Link>
                </SheetClose>
              </div>
            ) : null}

            <SheetClose asChild>
              <Link
                href="/resources"
                className={cn(
                  "rounded-xl px-4 py-3 text-base font-medium text-navy transition-colors hover:bg-navy/5",
                  focusRing
                )}
              >
                Resources
              </Link>
            </SheetClose>
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-border-subtle p-4">
            <SheetClose asChild>
              <Link
                href="/signin"
                className={cn(
                  "rounded-xl border border-navy/20 px-4 py-3 text-center text-sm font-medium text-navy transition-colors hover:border-navy hover:bg-navy hover:text-white",
                  focusRing
                )}
              >
                Sign In
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/signup"
                className={cn(
                  "rounded-xl bg-emerald px-4 py-3 text-center text-sm font-bold text-white shadow-card transition-all hover:bg-emerald/90",
                  focusRing
                )}
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
