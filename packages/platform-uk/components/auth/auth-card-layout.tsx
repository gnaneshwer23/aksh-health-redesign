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
    <div className="marketing-site marketing-site--editorial auth-night relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Same night backdrop as the public site: aurora light over a fine grid. The card stays light, like the product. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 75% 20%, rgba(94,242,207,0.20), transparent 70%), radial-gradient(ellipse 40% 40% at 20% 85%, rgba(142,162,255,0.12), transparent 70%), radial-gradient(ellipse 50% 40% at 10% 0%, rgba(11,74,66,0.55), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 40%, #000 30%, transparent 80%)",
        }}
      />
      <div
        className={cn(
          "auth-night__card relative w-full max-w-md rounded-[1.75rem] border border-white/60 p-6 sm:p-8",
          className
        )}
        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 40px 120px -40px rgba(0,0,0,0.8), 0 0 90px -30px rgba(94,242,207,0.45)" }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold"
            style={{ color: "#03201a", background: "linear-gradient(140deg, #b8fbe9, #5ef2cf 50%, #1f9e86)" }}
          >
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
