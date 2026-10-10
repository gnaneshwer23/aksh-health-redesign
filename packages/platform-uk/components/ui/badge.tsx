import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        accent: "border-transparent bg-secondary text-accent-foreground",
        outline: "text-foreground border-border-subtle bg-card",
        patient: "border-accent/20 bg-accent/10 text-secondary",
        clinical: "border-primary/15 bg-primary/10 text-primary",
        operational: "border-slate/15 bg-slate/10 text-slate",
        danger: "border-danger/20 bg-danger/10 text-[#b42318]",
        warning: "border-warning/20 bg-warning/10 text-[#8a5a00]",
        success: "border-accent/20 bg-accent/10 text-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
