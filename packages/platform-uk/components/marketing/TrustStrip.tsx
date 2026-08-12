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
        isHero
          ? "border-t border-black/[0.06] bg-white/50"
          : "border-y border-navy/10 bg-white"
      )}
      aria-label="Product trust signals"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-0">
        {trustBadges.map((badge, index) => (
          <span key={badge} className="inline-flex items-center">
            {index > 0 ? (
              <span
                className={cn(
                  "mx-2.5 hidden h-px w-4 sm:mx-4 sm:inline-block",
                  isHero ? "bg-black/20" : "bg-navy/20"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "text-xs font-medium tracking-[0.02em] sm:text-sm",
                isHero ? "text-black/65" : "text-navy"
              )}
            >
              {badge}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
