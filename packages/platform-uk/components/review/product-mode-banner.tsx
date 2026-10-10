export function ProductModeBanner({
  demoMode = false,
  recordingMode = false
}: {
  demoMode?: boolean;
  recordingMode?: boolean;
}) {
  const modeLabel = recordingMode
    ? "Recording walkthrough mode"
    : demoMode
      ? "Demo walkthrough mode"
      : "Synthetic validation mode";
  const headline = recordingMode
    ? "Presentation capture is active. Synthetic proof boundaries and evidence labels stay visible."
    : demoMode
      ? "External walkthrough path is active. Live health system/EHR integration remains off."
      : "Review, safety, and evidence workflows are active. Live health system/EHR integration is off.";
  const chips = recordingMode
    ? ["Synthetic data only", "Recording-safe UI", "No production clinical claims"]
    : demoMode
      ? ["Synthetic data only", "Demo storyline", "Integration rehearsal"]
      : ["Synthetic data only", "Integration rehearsal", "No production clinical claims"];

  return (
    <section className="product-mode-banner" aria-label="Product operating mode">
      <div>
        <span className="product-mode-banner__label">{modeLabel}</span>
        <strong>{headline}</strong>
      </div>
      <div className="product-mode-banner__chips" aria-label="Mode details">
        {chips.map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
    </section>
  );
}
