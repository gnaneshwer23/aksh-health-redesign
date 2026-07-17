const TRUST_PHRASES = [
  "Built for NHS primary care",
  "FHIR R4-ready architecture",
  "Clinician-reviewed outputs",
  "Pilot access open",
  "EMIS Web & SystmOne ready",
  "Human-in-the-loop review",
  "GDPR Art. 9 aware",
  "Audit trail on every decision",
  "Capture → draft → approve",
  "Named review before the record",
  "Draft until a clinician decides",
  "Designed for UK data protection",
] as const;

function MarqueeTrack({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="aksh-trust-marquee__track" aria-hidden={ariaHidden || undefined}>
      {TRUST_PHRASES.map((phrase) => (
        <span key={phrase} className="aksh-trust-marquee__item">
          <span className="aksh-trust-marquee__dot" aria-hidden />
          <span className="aksh-trust-marquee__text">{phrase}</span>
        </span>
      ))}
    </div>
  );
}

/** Slim right-to-left trust ticker for the homepage hero band. */
export default function TrustMarquee() {
  return (
    <div className="aksh-trust-marquee" aria-label="Product trust and pilot readiness">
      <ul className="sr-only">
        {TRUST_PHRASES.map((phrase) => (
          <li key={phrase}>{phrase}</li>
        ))}
      </ul>

      <div className="aksh-trust-marquee__viewport" aria-hidden>
        <div className="aksh-trust-marquee__rail">
          <MarqueeTrack />
          <MarqueeTrack ariaHidden />
        </div>
      </div>
    </div>
  );
}
