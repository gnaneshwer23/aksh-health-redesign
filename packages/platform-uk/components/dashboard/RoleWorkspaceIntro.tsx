import type { ReactNode } from "react";

/**
 * Shared role-home intro strip — keeps GP / nurse / pharmacist / admin first paint consistent
 * without inventing new clinical capabilities.
 */
export function RoleWorkspaceIntro({
  eyebrow,
  title,
  lede,
  actions,
  testId,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  actions?: ReactNode;
  testId?: string;
}) {
  return (
    <header
      className="rounded-frame border border-border-subtle bg-card/95 p-5 shadow-sm sm:p-6"
      data-testid={testId ?? "role-workspace-intro"}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1e4d52]">{eyebrow}</p>
      <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{lede}</div>
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
