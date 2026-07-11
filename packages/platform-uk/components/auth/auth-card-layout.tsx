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
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div
        className={cn(
          "w-full max-w-md rounded-2xl border border-border-subtle bg-card p-8 shadow-card",
          className
        )}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">
            A
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold text-primary">Aksh Health</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald">Healthcare OS</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}

        <div className="mt-6">{children}</div>

        {footer ? <div className="mt-6 border-t border-border-subtle pt-6">{footer}</div> : null}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-steel transition-colors hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
