"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-200 ${
        scrolled ? "border-b border-border bg-white/95 shadow-sm backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
            <span className="text-sm font-bold text-white">A</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold leading-none text-navy">Aksh Health</span>
            <span className="text-[10px] font-medium leading-none text-emerald">Healthcare OS</span>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            ["Platform", "/platform"],
            ["For Clinicians", "/for-clinicians"],
            ["For Hospitals", "/for-hospitals"],
            ["For Patients", "/for-patients"],
            ["Docs", "/docs"],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className={`text-sm font-medium transition-colors ${
                scrolled ? "text-steel hover:text-navy" : "text-white/90 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className={`hidden rounded-lg border px-4 py-2 text-sm font-medium transition-colors md:block ${
              scrolled
                ? "border-navy text-navy hover:bg-navy hover:text-white"
                : "border-white/60 text-white hover:border-white"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/pilot"
            className="rounded-lg bg-white px-5 py-2 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-white/90"
          >
            Request Pilot
          </Link>
        </div>
      </div>
    </nav>
  );
}
