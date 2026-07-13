"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MegaLink = { label: string; href: string; description?: string; badge?: string };
type MegaColumn = { pill: string; links: MegaLink[]; cta?: { label: string; href: string } };

const megaMenus: Record<string, MegaColumn[]> = {
  Platform: [
    {
      pill: "Platform",
      links: [
        { label: "Overview", href: "/platform", description: "Agents, review, and FHIR staging" },
        { label: "Integrations", href: "/integrations", description: "NHS systems and FHIR R4" },
        { label: "Security & safety", href: "/security", description: "Safety case and audit posture" },
      ],
      cta: { label: "Book a walkthrough", href: "/demo/patel" },
    },
    {
      pill: "Capabilities",
      links: [
        { label: "Human-in-the-loop review", href: "/platform#hitl" },
        { label: "FHIR R4 staging", href: "/how-it-works#journey" },
        { label: "Specialist agents", href: "/platform#agents" },
      ],
    },
    {
      pill: "Get started",
      links: [
        { label: "Request organisation access", href: "/get-started" },
        { label: "Create account", href: "/signup" },
        { label: "Pricing", href: "/pricing" },
      ],
    },
  ],
  Solutions: [
    {
      pill: "Care delivery",
      links: [
        {
          label: "Clinicians",
          href: "/for-clinicians",
          description: "GPs, nurses, and pharmacists",
        },
        { label: "Practice managers", href: "/for-practices", description: "Operations and governance" },
        { label: "Patients", href: "/for-patients", description: "Support between appointments" },
      ],
    },
    {
      pill: "Systems",
      links: [
        { label: "Hospitals", href: "/for-hospitals", description: "Command centre and capacity" },
        { label: "ICS leads", href: "/for-ics", description: "Population health intelligence" },
        { label: "Administrators", href: "/for-administrators", description: "Integrations and uptime" },
      ],
    },
    {
      pill: "Partners",
      links: [
        { label: "Research", href: "/for-research", description: "Governed outcome evaluation", badge: "Open" },
        { label: "View all roles", href: "/platform#roles" },
      ],
    },
  ],
  Resources: [
    {
      pill: "Latest",
      links: [
        { label: "Resources hub", href: "/resources", description: "Architecture and compliance reference" },
        { label: "FAQ", href: "/faq", description: "Procurement and clinical questions" },
        { label: "Contact", href: "/contact", description: "General enquiries" },
      ],
    },
    {
      pill: "Learn more",
      links: [
        {
          label: "Case walkthrough",
          href: "/walkthrough",
          description: "Patel practice story and live demo",
        },
      ],
    },
  ],
};

const centerLinks = [
  { label: "Platform", href: "/platform", mega: true },
  { label: "How it works", href: "/how-it-works", mega: false },
  { label: "Solutions", href: "/for-clinicians", mega: true },
  { label: "Resources", href: "/resources", mega: true },
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
  const [openMega, setOpenMega] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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
  const useSolidNav = scrolled || (!overDarkHero && !overLightHero) || Boolean(openMega);

  function openMenu(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMega(label);
  }

  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMega(null), 220);
  }

  return (
    <nav
      data-over-dark-hero={transparentOverDark ? "true" : "false"}
      data-over-light-hero={transparentOverLight && !openMega ? "true" : "false"}
      data-solid-navbar={useSolidNav ? "true" : "false"}
      className={cn(
        "owkin-nav fixed top-0 z-50 w-full transition-colors duration-200",
        useSolidNav ? "owkin-nav--solid" : "owkin-nav--transparent"
      )}
      onMouseLeave={scheduleClose}
    >
      <div className="owkin-nav__bar mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className={cn("owkin-nav__brand", focusRing)} onMouseEnter={() => setOpenMega(null)}>
          <span className="owkin-nav__mark" aria-hidden>
            A
          </span>
          <span className="owkin-nav__wordmark">Aksh Health</span>
        </Link>

        <div className="owkin-nav__center hidden lg:flex" aria-label="Primary">
          {centerLinks.map((item) => {
            const isOpen = openMega === item.label;
            if (!item.mega) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn("owkin-nav__link", focusRing)}
                  onMouseEnter={() => setOpenMega(null)}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <button
                key={item.label}
                type="button"
                className={cn("owkin-nav__link", isOpen && "is-active", focusRing)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls={`${menuId}-${item.label}`}
                onMouseEnter={() => openMenu(item.label)}
                onFocus={() => openMenu(item.label)}
                onClick={() => setOpenMega(isOpen ? null : item.label)}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/signin" className={cn("owkin-nav__ghost-link", focusRing)}>
            Sign In
          </Link>
          <Link href="/get-started" className={cn("owkin-nav__pill", focusRing)}>
            Get in touch
          </Link>
          <Link
            href="/resources"
            className={cn("owkin-nav__search", focusRing)}
            aria-label="Search resources"
            title="Resources"
          >
            <Search className="h-4 w-4" aria-hidden />
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

      {openMega && megaMenus[openMega] ? (
        <div
          id={`${menuId}-${openMega}`}
          className="owkin-mega"
          onMouseEnter={() => openMenu(openMega)}
          onMouseLeave={scheduleClose}
        >
          <div className="owkin-mega__panel mx-auto max-w-7xl px-6 py-8">
            <div className="owkin-mega__grid">
              {megaMenus[openMega].map((column) => (
                <div key={column.pill} className="owkin-mega__col">
                  <span className="owkin-mega__pill">{column.pill}</span>
                  <ul className="owkin-mega__list">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="owkin-mega__item" onClick={() => setOpenMega(null)}>
                          <span className="owkin-mega__item-label">
                            {link.label}
                            {link.badge ? <span className="owkin-mega__badge">{link.badge}</span> : null}
                          </span>
                          {link.description ? (
                            <span className="owkin-mega__item-desc">{link.description}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {column.cta ? (
                    <Link href={column.cta.href} className="owkin-btn-ink owkin-mega__cta" onClick={() => setOpenMega(null)}>
                      {column.cta.label}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="mobile-nav-menu"
          side="right"
          className="flex w-[min(100vw,22rem)] flex-col border-l border-black/5 bg-[var(--owkin-cream)] p-0"
        >
          <div className="border-b border-black/5 px-6 py-5">
            <p className="text-sm font-semibold text-[var(--owkin-ink)]">Menu</p>
            <p className="text-xs text-black/50">Aksh Health Healthcare OS</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4" aria-label="Mobile navigation">
            {centerLinks.map((item) => (
              <SheetClose key={item.label} asChild>
                <Link href={item.href} className={cn("rounded-xl px-4 py-3 text-base font-medium text-[var(--owkin-ink)]", focusRing)}>
                  {item.label}
                </Link>
              </SheetClose>
            ))}
            {megaMenus.Solutions.flatMap((col) =>
              col.links.map((link) => (
                <SheetClose key={link.href + link.label} asChild>
                  <Link href={link.href} className={cn("rounded-xl px-4 py-2.5 text-sm text-black/70", focusRing)}>
                    {link.label}
                  </Link>
                </SheetClose>
              ))
            )}
            <SheetClose asChild>
              <Link href="/security" className={cn("rounded-xl px-4 py-2.5 text-sm text-black/70", focusRing)}>
                Security & safety
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/faq" className={cn("rounded-xl px-4 py-2.5 text-sm text-black/70", focusRing)}>
                FAQ
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/contact" className={cn("rounded-xl px-4 py-2.5 text-sm text-black/70", focusRing)}>
                Contact
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/walkthrough" className={cn("rounded-xl px-4 py-2.5 text-sm text-black/70", focusRing)}>
                Case walkthrough
              </Link>
            </SheetClose>
          </nav>

          <div className="mt-auto flex flex-col gap-3 border-t border-black/5 p-4">
            <SheetClose asChild>
              <Link href="/signin" className={cn("owkin-nav__pill text-center", focusRing)}>
                Sign In
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/get-started" className={cn("owkin-btn-ink text-center", focusRing)}>
                Get in touch
              </Link>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
