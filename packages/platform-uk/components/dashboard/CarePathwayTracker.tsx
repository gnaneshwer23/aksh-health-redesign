import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { CarePathway } from "@/lib/mock-data/types";
import { cn } from "@/lib/utils";

export function CarePathwayTracker({ pathways }: { pathways: CarePathway[] }) {
  if (!pathways.length) return <p className="text-sm text-muted">No active care pathways</p>;

  return (
    <div className="space-y-4">
      {pathways.map((cp) => {
        const done = cp.steps.filter((s) => s.status === "Completed").length;
        const total = cp.steps.length;
        const next = cp.steps.find((s) => s.status === "InProgress" || s.status === "AwaitingApproval");

        return (
          <div key={cp.id} className="rounded-sm border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{cp.name}</h3>
              <Badge variant="outline">{done}/{total}</Badge>
            </div>
            <div className="mt-2 h-2 rounded-full bg-background">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            {next && <p className="mt-2 text-xs text-muted">Next: {next.title}</p>}
            <div className="mt-3 flex gap-1">
              {cp.steps.map((s) => (
                <span
                  key={s.stepNumber}
                  title={s.title}
                  className={cn(
                    "h-2 flex-1 rounded-sm",
                    s.status === "Completed" && "bg-accent",
                    s.status === "InProgress" && "bg-primary",
                    s.status === "AwaitingApproval" && "bg-warning",
                    s.status === "Pending" && "bg-border"
                  )}
                />
              ))}
            </div>
            <Link href="/dashboard/gp/care-pathways" className="mt-2 inline-block text-xs text-primary hover:underline">View Full Pathway</Link>
          </div>
        );
      })}
    </div>
  );
}
