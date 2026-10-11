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
    <div className="marketing-site marketing-site--editorial relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 10%, rgba(0,168,142,0.10), transparent 55%), radial-gradient(ellipse 60% 45% at 90% 85%, rgba(232,243,254,0.9), transparent 50%), #F7F8FA",
        }}
      />
      <div
        className={cn(
          "relative w-full max-w-md rounded-[2rem] border border-[var(--mk-line)] bg-white/95 p-6 shadow-[var(--mk-shadow-frame)] backdrop-blur-sm sm:p-8",
          className
        )}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-soft">
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
