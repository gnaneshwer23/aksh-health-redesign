"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { hi } from "@/lib/i18n/hi";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell stack">
      <header className="stack">
        <div>
          <span className="badge">Phase 0 · Synthetic only</span>
          <h1>{hi.appName}</h1>
          <p className="muted">{hi.tagline}</p>
        </div>
        <nav className="nav">
          {[
            { href: "/", label: hi.nav.home },
            { href: "/intake", label: hi.nav.intake },
            { href: "/review", label: hi.nav.review }
          ].map((item) => (
            <Link key={item.href} href={item.href} data-active={pathname === item.href ? "true" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="notice">{hi.proofNotice}</p>
      </header>
      <main>{children}</main>
    </div>
  );
}
