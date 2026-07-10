"use client";

import { Badge } from "@/components/ui/badge";
import { resolveDashboardPath } from "@/lib/onboarding/roles";
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

  return (
    <div className="rounded-lg border border-dashed border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Sandbox preview</p>
        <Badge variant="outline">Read-only</Badge>
      </div>
      <div className="space-y-2 rounded-md border border-border bg-card p-4 text-sm">
        <p className="font-medium">{name}</p>
        <p className="text-muted">Role: {role ?? "Not selected"}</p>
        {organisation.practiceName ? (
          <p className="text-muted">Organisation: {String(organisation.practiceName)}</p>
        ) : null}
        {organisation.odsCode ? (
          <p className="text-muted">ODS: {String(organisation.odsCode)}</p>
        ) : null}
        <p className={cn("text-xs text-muted")}>
          Destination: {resolveDashboardPath(role)}
        </p>
      </div>
    </div>
  );
}
