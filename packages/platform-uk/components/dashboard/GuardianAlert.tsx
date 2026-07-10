import { cn } from "@/lib/utils";

export function GuardianAlert({
  severity,
  title,
  description,
  bnfRef,
  className,
}: {
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  bnfRef?: string;
  className?: string;
}) {
  const colors = {
    high: "border-danger/30 bg-danger/5 text-danger",
    medium: "border-warning/30 bg-warning/5 text-warning",
    low: "border-accent/30 bg-accent/5 text-secondary",
  };
  const dots = { high: "bg-danger", medium: "bg-warning", low: "bg-accent" };

  return (
    <div className={cn("rounded-sm border p-3 text-xs", colors[severity], className)} role="alert">
      <div className="flex items-start gap-2">
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", dots[severity])} />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 opacity-90">{description}</p>
          {bnfRef && <p className="mt-1 text-[10px] opacity-75">{bnfRef}</p>}
        </div>
      </div>
    </div>
  );
}
