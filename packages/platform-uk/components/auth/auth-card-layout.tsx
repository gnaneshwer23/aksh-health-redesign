import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthCardLayout({
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="marketing-site marketing-site--editorial auth-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Same warm canvas as the public site and the workspace: greige ground, a sage and a lime disc. */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full" style={{ background: "#e7eadb" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-[260px] w-[260px] rounded-full" style={{ background: "#dcef55" }} />
      <div
        className={cn("auth-canvas__card relative w-full max-w-md rounded-[2rem] border p-6 sm:p-8", className)}
        style={{ borderColor: "#e3e1d6", boxShadow: "0 1px 2px rgba(18,23,21,0.05), 0 40px 80px -40px rgba(18,23,21,0.28)" }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold" style={{ background: "#121715", color: "#dcef55" }}>
            A
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold text-[var(--mk-ink)]">Aksh Health</p>
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--mk-ink)]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[var(--mk-muted)]">{subtitle}</p> : null}

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 border-t border-[var(--mk-line)] pt-6">{footer}</div> : null}

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--mk-muted)] transition-colors hover:text-[var(--mk-accent)]"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
