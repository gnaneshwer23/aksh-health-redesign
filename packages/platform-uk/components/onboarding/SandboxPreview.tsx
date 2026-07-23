"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { resolveOrganisationOdsCode } from "@/lib/onboarding/organisation-ods";
import { getRoleOnboardingPath } from "@/lib/onboarding/role-paths";
import { getRoleDefinition, resolveDashboardPath } from "@/lib/onboarding/roles";
import { ROLE_DASHBOARD_PREVIEW } from "@/lib/product-journey";
import { useOnboardingStore } from "@/lib/onboarding/store";
import { cn } from "@/lib/utils";

export function SandboxPreview() {
  const role = useOnboardingStore((s) => s.role);
  const identity = useOnboardingStore((s) => s.identity);
  const organisation = useOnboardingStore((s) => s.organisation);
  const preferences = useOnboardingStore((s) => s.preferences);

  const name =
    (identity.fullName as string) ||
    [identity.firstName, identity.lastName].filter(Boolean).join(" ") ||
    "Your dashboard";

  const odsCode = resolveOrganisationOdsCode(organisation);
  const def = getRoleDefinition(role);
  const preview = role ? ROLE_DASHBOARD_PREVIEW[role] : null;
  const path = getRoleOnboardingPath(role);
  const prefKeys = Object.keys(preferences ?? {}).filter(
    (key) => typeof preferences[key] === "string" && String(preferences[key]).trim()
  );

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
          {path?.pathPromise ? (
            <p className="mt-1 text-xs text-foreground">{path.pathPromise}</p>
          ) : null}
          {organisation.practiceName ? (
            <p className="text-muted">Organisation: {String(organisation.practiceName)}</p>
          ) : null}
          {odsCode ? <p className="text-muted">ODS: {odsCode}</p> : null}
        </div>

        {path?.agents?.length ? (
          <div className="flex flex-wrap gap-1" aria-label="Agents for your role">
            {path.agents.slice(0, 8).map((agent) => (
              <Badge key={agent.name} variant="outline" className="text-[10px]">
                {agent.name}
                {agent.badge === "phase2" ? " · Phase 2" : ""}
                {agent.badge === "subcap" ? " · Sub-cap" : ""}
              </Badge>
            ))}
          </div>
        ) : null}

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
            {preview.youApprove ? (
              <p className="mt-2 text-xs text-foreground">
                <span className="font-medium">You approve: </span>
                {preview.youApprove}
              </p>
            ) : null}
            <p className="mt-3 rounded-md border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-foreground">
              <span className="font-medium">First focus: </span>
              {preview.firstFocus}
            </p>
            {prefKeys.length > 0 ? (
              <p className="mt-2 text-xs text-muted">
                Preferences saved ({prefKeys.length}) will shape first-run tips on your dashboard.
              </p>
            ) : null}
            {preview.honesty ? (
              <p className="mt-2 text-[11px] text-muted">{preview.honesty}</p>
            ) : (
              <p className="mt-2 text-[11px] text-muted">liveEmis:false</p>
            )}
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
