const trustBadges = [
  "NHS-ready",
  "FHIR R4",
  "GDPR Art. 9",
  "MHRA-aware",
  "Synthetic-safe demo",
] as const;

export default function TrustStrip() {
  return (
    <div
      className="border-y border-navy/10 bg-white/95 px-4 py-3 backdrop-blur-sm"
      aria-label="Compliance and safety credentials"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {trustBadges.map((badge) => (
          <span
            key={badge}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald/20 bg-emerald/5 px-3 py-1 text-xs font-semibold text-navy"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" aria-hidden="true" />
            {badge}
          </span>
        ))}
      </div>
    </div>
  );
}
