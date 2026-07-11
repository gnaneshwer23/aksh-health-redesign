"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-200",
        scrolled ? "border-b border-border-subtle bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy shadow-sm">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold leading-none text-navy">Aksh Health</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald">Healthcare OS</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            ["Platform", "/platform"],
            ["For Clinicians", "/for-clinicians"],
            ["For Hospitals", "/for-hospitals"],
            ["For Patients", "/for-patients"],
            ["For Administrators", "/for-administrators"],
            ["Docs", "/docs"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors",
                scrolled ? "text-steel hover:text-navy" : "text-white/90 hover:text-white"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className={cn(
              "hidden rounded-xl border px-4 py-2 text-sm font-medium transition-all md:block",
              scrolled
                ? "border-navy/20 text-navy hover:border-navy hover:bg-navy hover:text-white"
                : "border-white/50 text-white hover:border-white hover:bg-white/10"
            )}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(
              "hidden rounded-xl px-4 py-2 text-sm font-semibold transition-all md:block",
              scrolled
                ? "bg-emerald text-white hover:bg-emerald/90"
                : "bg-white/15 text-white hover:bg-white/25"
            )}
          >
            Sign Up
          </Link>
          <Link
            href="/pilot"
            className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-navy shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            Request Pilot
          </Link>
        </div>
      </div>
    </nav>
  );
}
