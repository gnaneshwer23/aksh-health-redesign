import { cn } from "@/lib/utils";

const trustBadges = [
  "Built for NHS primary care",
  "FHIR R4-ready architecture",
  "Clinician-reviewed outputs",
  "Pilot access open",
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
          ? "border-t border-black/[0.06] bg-white/35 backdrop-blur-md"
          : "border-y border-navy/10 bg-white shadow-sm"
      )}
      aria-label="Product trust and pilot readiness"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-1 gap-y-2 sm:gap-x-0">
        {trustBadges.map((badge, index) => (
          <span key={badge} className="inline-flex items-center">
            {index > 0 ? (
              <span
                className={cn(
                  "mx-2.5 hidden h-1 w-1 rounded-full sm:mx-3.5 sm:inline-block",
                  isHero ? "bg-black/25" : "bg-emerald/50"
                )}
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "text-xs font-semibold tracking-[0.04em] sm:text-sm",
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
