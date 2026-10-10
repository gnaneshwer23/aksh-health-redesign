import { PLATFORM_AGENTS } from "@/components/marketing/lavender/vision-content";

export default function LvAgents() {
  return (
    <section className="lv-section" aria-labelledby="lv-agents-title" data-section="agents">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">Platform agents</p>
            <h2 id="lv-agents-title" className="lv-h2 mt-3">
              Specialist agents. None of them decides.
            </h2>
          </div>
          <p className="lv-lede">
            Each agent drafts, checks or stages inside a defined boundary, under one supervisor and one audit trail.
            Every card shows its real build status, including the ones that are partial or not built yet.
          </p>
        </div>

        <ul className="lv-agents">
          {PLATFORM_AGENTS.map((a) => (
            <li key={a.codename} className="lv-agent">
              <div className="lv-agent__head">
                <h3 className="lv-agent__label">{a.label}</h3>
                <span className={`lv-status lv-status--${a.status.tone}`}>{a.status.label}</span>
              </div>
              <p className="lv-agent__name">{a.codename}</p>
              <p className="lv-agent__role">{a.role}</p>
              {a.includes ? <p className="lv-agent__alias">{a.includes}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
