export function TrustStrip({ badges }: { badges: string[] }) {
  return (
    <div className="lp-trust-strip" aria-label="Trust and compliance posture">
      {badges.map((badge) => (
        <span className="lp-trust-badge" key={badge}>
          {badge}
        </span>
      ))}
    </div>
  );
}
