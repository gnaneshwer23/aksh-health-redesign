import { cn } from "@/lib/utils";

const trustBadges = [
  "In production",
  "Audit trail on every decision",
  "Draft until a clinician decides",
  "UK data residency",
  "Built for diabetes & primary care",
] as const;

type TrustStripProps = {
  variant?: "default" | "hero";
};

/** Quiet editorial trust line — separators, not pill chips. */
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
      <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-0 gap-y-2 text-center text-xs font-medium tracking-[0.01em] text-[var(--mk-muted)] sm:text-sm">
        {trustBadges.map((badge, index) => (
          <li key={badge} className="inline-flex items-center">
            {index > 0 ? (
              <span className="mx-2.5 hidden text-[var(--mk-line-strong,rgba(20,32,30,0.22))] sm:inline" aria-hidden>
                ·
              </span>
            ) : null}
            <span className={cn(isHero ? "text-[var(--mk-muted)]" : "text-[var(--mk-ink)]/75")}>{badge}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
