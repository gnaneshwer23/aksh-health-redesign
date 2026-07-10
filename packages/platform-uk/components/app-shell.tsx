"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import type { Route } from "next";
import type { ReactNode } from "react";

import { ProductModeBanner } from "@/components/review/product-mode-banner";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get("demo") === "1";
  const recordingMode = searchParams.get("recording") === "1";
  const { data: session } = useSession();

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() 
    || session?.user?.email?.charAt(0).toUpperCase() 
    || "?";

  const navItems: Array<{ href: Route; label: string }> = [
    { href: "/gp-dashboard", label: "GP Dashboard" },
    { href: "/review/command-centre", label: "Command" },
    { href: "/review/team-mode", label: "Team" },
    { href: "/review/demo-mode", label: "Demo" },
    { href: "/review", label: "Review" },
    { href: "/review/readiness", label: "Evidence" },
    { href: "/review/roadmap", label: "Roadmap" }
  ];
  const isActiveNavItem = (href: Route) => {
    if (href === "/review") {
      return pathname === "/review";
    }

    if (href === "/gp-dashboard") {
      return pathname === "/gp-dashboard" || pathname.startsWith("/dashboard/gp");
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className={`shell stack${recordingMode ? " recording-shell" : ""}`}>
      <header className="workspace-shell">
        <div className="workspace-shell__top">
          <div className="workspace-shell__brand-block">
            <Link href="/review/command-centre" className="workspace-shell__brand">
              <span className="workspace-shell__brand-mark">A</span>
              <span>AkshHealth</span>
            </Link>
            <span className="workspace-shell__environment">Clinician workspace</span>
          </div>

          <nav className="workspace-shell__nav" aria-label="Workspace">
            {navItems.map((item) => (
              <Link
                className={`workspace-shell__nav-link${isActiveNavItem(item.href) ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {session?.user ? (
            <div className="workspace-shell__user">
              <span className="session-user-avatar">{userInitial}</span>
              <div className="workspace-shell__user-meta">
                <strong>{session.user.name || "Clinical reviewer"}</strong>
                <span>{session.user.email}</span>
              </div>
              <button className="sign-out-btn" onClick={() => signOut({ callbackUrl: "/" })} title="Sign out" type="button">
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        <div className="workspace-shell__hero">
          <div>
            <p className="workspace-shell__eyebrow">UK/EU synthetic proof workspace</p>
            <h1>Choose the right path before opening another screen.</h1>
            <p>
              Start from Command, then move into Team Mode for execution or Demo Mode for a clean external walkthrough.
            </p>
          </div>
          <div className="actions workspace-shell__actions">
            <Link className="button primary" href="/review/command-centre">
              Command Centre
            </Link>
            <Link className="button secondary" href="/review/team-mode">
              Team Mode
            </Link>
            <Link className="button secondary" href="/review/demo-mode">
              Demo Mode
            </Link>
          </div>
        </div>

        {demoMode || recordingMode ? (
          <div className="pill-row">
            {demoMode ? <span className="pill">Demo mode</span> : null}
            {recordingMode ? <span className="pill">Recording mode</span> : null}
          </div>
        ) : null}
        <ProductModeBanner demoMode={demoMode} recordingMode={recordingMode} />
      </header>
      {children}
    </div>
  );
}
