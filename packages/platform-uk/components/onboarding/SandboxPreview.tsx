"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { resolveOrganisationOdsCode } from "@/lib/onboarding/organisation-ods";
import { getRoleDefinition, resolveDashboardPath } from "@/lib/onboarding/roles";
import { ROLE_DASHBOARD_PREVIEW } from "@/lib/product-journey";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";

export function SandboxPreview() {
  const role = useOnboardingStore((s) => s.role);
  const identity = useOnboardingStore((s) => s.identity);
  const organisation = useOnboardingStore((s) => s.organisation);

  const name =
    (identity.fullName as string) ||
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    "Your dashboard";

  const odsCode = resolveOrganisationOdsCode(organisation);
  const def = getRoleDefinition(role);
  const preview = role ? ROLE_DASHBOARD_PREVIEW[role] : null;

  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">What you&apos;ll see next</p>
        <Badge variant="outline">Preview</Badge>
      </div>
      <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-muted">
            {preview?.workspaceLabel ?? def?.label ?? "Workspace"} · {role ?? "role not selected"}
          </p>
          {organisation.practiceName ? (
            <p className="text-muted">Organisation: {String(organisation.practiceName)}</p>
          ) : null}
          {odsCode ? <p className="text-muted">ODS: {odsCode}</p> : null}
        </div>

        {preview ? (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              On your dashboard
            </p>
            <ul className="list-disc space-y-1 pl-4 text-muted">
              {preview.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
            <p className="mt-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-foreground">
              <span className="font-medium">First focus: </span>
              {preview.firstFocus}
            </p>
          </div>
        ) : null}

        <p className={cn("text-xs text-muted")}>
          Continues to{" "}
          <span className="font-medium text-foreground">{resolveDashboardPath(role)}</span>
          {preview?.docsHref ? (
            <>
              {" "}
              ·{" "}
              <Link href={preview.docsHref} className="text-primary underline-offset-2 hover:underline">
                Related guide
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
