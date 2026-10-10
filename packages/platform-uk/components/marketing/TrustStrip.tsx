import { cn } from "@/lib/utils";

const trustBadges = [
  { title: "Human review", detail: "Named clinician decides" },
  { title: "Auditability", detail: "Every decision attributed" },
  { title: "Regional data residency", detail: "Data stays in your market" },
  { title: "Diabetes & primary care", detail: "Focused clinical wedge" },
] as const;

type TrustStripProps = {
  variant?: "default" | "hero";
};

/** Soft trust chips — MedTrust-inspired, still quiet and clinical. */
export default function TrustStrip({ variant = "default" }: TrustStripProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn("aksh-trust-chips", isHero ? "aksh-trust-chips--hero" : "aksh-trust-chips--band")}
      aria-label="Product trust signals"
    >
      <ul className="aksh-trust-chips__list">
        {trustBadges.map((badge) => (
          <li key={badge.title} className="aksh-trust-chip">
            <span className="aksh-trust-chip__check" aria-hidden>
              ✓
            </span>
            <span>
              <strong>{badge.title}</strong>
              <em>{badge.detail}</em>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
