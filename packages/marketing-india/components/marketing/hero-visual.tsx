export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-visual__glow" />
      <article className="hero-visual__panel hero-visual__panel--main">
        <header className="hero-visual__header">
          <span className="hero-visual__dot hero-visual__dot--live" />
          Hindi GP dashboard · SOAP editor
        </header>
        <div className="hero-visual__metrics">
          <div>
            <strong>142</strong>
            <span>Patients today</span>
          </div>
          <div>
            <strong>6</strong>
            <span>Languages</span>
          </div>
          <div>
            <strong>38m</strong>
            <span>Doc time saved</span>
          </div>
        </div>
        <div className="hero-visual__list">
          <div className="hero-visual__row">
            <span>Hindi SOAP draft</span>
            <em className="hero-visual__tag hero-visual__tag--warn">Review</em>
          </div>
          <div className="hero-visual__row">
            <span>Indian Pharmacopoeia DDI</span>
            <em className="hero-visual__tag hero-visual__tag--danger">Flagged</em>
          </div>
          <div className="hero-visual__row">
            <span>ABDM FHIR export</span>
            <em className="hero-visual__tag hero-visual__tag--good">Ready</em>
          </div>
        </div>
      </article>
      <article className="hero-visual__panel hero-visual__panel--float hero-visual__panel--top">
        <span className="hero-visual__icon">+</span>
        <div>
          <strong>WhatsApp reminder</strong>
          <span>No-show follow-up sent</span>
        </div>
      </article>
      <article className="hero-visual__panel hero-visual__panel--float hero-visual__panel--bottom">
        <strong>ABHA</strong>
        <span>Patient identity linked</span>
      </article>
    </div>
  );
}
