import { cn } from "@/lib/utils";

const trustBadges = [
  "Audit trail on every decision",
  "Draft until a clinician decides",
  "UK data residency",
  "Built for NHS primary care",
] as const;

type TrustStripProps = {
  variant?: "default" | "hero";
};

export default function TrustStrip({ variant = "default" }: TrustStripProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "px-4 py-5 md:py-6",
        isHero ? "border-t border-[var(--mk-line)]" : "border-y border-[var(--mk-line)]"
      )}
      aria-label="Product trust signals"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        {trustBadges.map((badge) => (
          <span
            key={badge}
            className={cn(
              "inline-flex items-center rounded-full border border-[var(--mk-line)] bg-white/90 px-3.5 py-1.5 text-xs font-medium tracking-[0.01em] text-[var(--mk-ink)] shadow-sm sm:text-sm",
              isHero && "bg-white/70 text-[var(--mk-muted)]"
            )}
          >
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
