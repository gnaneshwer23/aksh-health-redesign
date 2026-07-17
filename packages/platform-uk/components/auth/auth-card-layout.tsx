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
    <div className="marketing-site marketing-site--editorial flex min-h-screen items-center justify-center bg-[var(--mk-surface)] px-4 py-10 sm:px-6">
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border border-[var(--mk-line)] bg-white p-6 shadow-[var(--mk-shadow-frame)] sm:p-8",
          className
        )}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--mk-accent)] text-sm font-bold text-white">
            A
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-[var(--mk-ink)]">Aksh Health</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mk-accent)]">Healthcare OS</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--mk-ink)]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-[var(--mk-muted)]">{subtitle}</p> : null}

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 border-t border-[var(--mk-line)] pt-6">{footer}</div> : null}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-[var(--mk-muted)] transition-colors hover:text-[var(--mk-accent)]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
