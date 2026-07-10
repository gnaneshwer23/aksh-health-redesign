import { cn } from "@/lib/utils";

type CalloutVariant = "info" | "success" | "warning" | "danger";

const variantStyles: Record<CalloutVariant, string> = {
  info: "border-primary/30 bg-primary/5",
  success: "border-accent/30 bg-accent/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-danger/30 bg-danger/5",
};

export function CalloutBox({
  title,
  children,
  variant = "info",
  className,
}: {
  title?: string;
  children: React.ReactNode;
  variant?: CalloutVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 shadow-sm",
        variantStyles[variant],
        className
      )}
    >
      {title ? (
        <p className="mb-2 font-semibold text-foreground">{title}</p>
      ) : null}
      <div className="text-sm text-muted">{children}</div>
    </div>
  );
}
