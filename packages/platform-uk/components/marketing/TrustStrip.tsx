import { cn } from "@/lib/utils";

const trustBadges = [
  "NHS-ready",
  "FHIR R4",
  "GDPR Art. 9",
  "MHRA-aware",
  "Synthetic-safe demo",
] as const;

type TrustStripProps = {
  variant?: "default" | "hero";
};

export default function TrustStrip({ variant = "default" }: TrustStripProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "px-4 py-3",
        isHero
          ? "border-t border-white/10 bg-white/5 backdrop-blur-md"
          : "border-y border-navy/10 bg-white/95 backdrop-blur-sm"
      )}
      aria-label="Compliance and safety credentials"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
        {trustBadges.map((badge) => (
          <span
            key={badge}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold sm:text-sm",
              isHero
                ? "border border-white/20 bg-white/10 text-white/90"
                : "border border-emerald/20 bg-emerald/5 text-navy"
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", isHero ? "bg-accent" : "bg-emerald")}
              aria-hidden="true"
            />
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
