import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const PASTEL_VARIANTS = ["blue", "mint", "lavender", "peach"] as const;
export type PastelVariant = (typeof PASTEL_VARIANTS)[number];

const variantStyles: Record<PastelVariant, { bg: string; ink: string }> = {
  blue: { bg: "bg-pastel-blue", ink: "text-pastel-blue-ink" },
  mint: { bg: "bg-pastel-mint", ink: "text-pastel-mint-ink" },
  lavender: { bg: "bg-pastel-lavender", ink: "text-pastel-lavender-ink" },
  peach: { bg: "bg-pastel-peach", ink: "text-pastel-peach-ink" },
};

export function pastelVariantAt(index: number): PastelVariant {
  return PASTEL_VARIANTS[index % PASTEL_VARIANTS.length];
}

type PastelCapabilityCardProps = {
  variant: PastelVariant;
  icon: LucideIcon;
  stepNumber?: string;
  label?: string;
  title: string;
  description: string;
  className?: string;
  compact?: boolean;
  href?: string;
  footer?: React.ReactNode;
};

export function PastelCapabilityCard({
  variant,
  icon: Icon,
  stepNumber,
  label,
  title,
  description,
  className,
  compact = false,
  href,
  footer,
}: PastelCapabilityCardProps) {
  const styles = variantStyles[variant];

  const card = (
    <div
      className={cn(
        "marketing-pastel-card h-full rounded-2xl border border-white/60",
        styles.bg,
        compact ? "p-5" : "p-8",
        href && "transition-transform group-hover:-translate-y-0.5",
        className
      )}
    >
      <div className={cn("flex items-center justify-between", compact ? "mb-4" : "mb-5")}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70">
          <Icon className={cn("h-5 w-5", styles.ink)} aria-hidden />
        </div>
        {stepNumber ? <span className="text-sm font-bold text-navy/40">{stepNumber}</span> : null}
      </div>
      {label ? (
        <p className={cn("mb-1 text-xs font-bold uppercase tracking-wider", styles.ink)}>{label}</p>
      ) : null}
      <p className={cn("font-bold text-navy", compact ? "mb-2 text-base" : "mb-3 text-lg")}>{title}</p>
      <p className="text-sm leading-relaxed text-steel">{description}</p>
      {footer}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {card}
      </Link>
    );
  }

  return card;
}

type PastelStatChipProps = {
  variant: PastelVariant;
  value: string;
  label: string;
  detail?: string;
  className?: string;
};

export function PastelStatChip({ variant, value, label, detail, className }: PastelStatChipProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "marketing-pastel-card rounded-2xl border border-white/60 px-5 py-4 text-center sm:text-left",
        styles.bg,
        className
      )}
    >
      <p className={cn("text-3xl font-bold tracking-tight md:text-[2.25rem]", styles.ink)}>{value}</p>
      <p className="mt-2 text-sm font-semibold text-navy">{label}</p>
      {detail ? <p className="mt-1 text-xs leading-relaxed text-steel">{detail}</p> : null}
    </div>
  );
}
