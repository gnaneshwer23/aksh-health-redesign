import type { LucideIcon } from "lucide-react";
import { Activity, Apple, Brain, Dumbbell, Droplet, Eye, LineChart, ShieldPlus, Syringe } from "lucide-react";

import { DIABETES_AREAS } from "@/components/marketing/lavender/vision-content";

const AREA_ICONS: Record<string, LucideIcon> = {
  Glucose: Droplet,
  HbA1c: LineChart,
  Insulin: Syringe,
  "GLP-1": Activity,
  Nutrition: Apple,
  Exercise: Dumbbell,
  Behaviour: Brain,
  Complications: Eye,
  Prevention: ShieldPlus,
};

export default function LvDiabetesModule() {
  return (
    <section className="lv-section" aria-labelledby="lv-diabetes-title" data-section="diabetes">
      <div className="lv-container">
        <div className="lv-section-head">
          <div>
            <p className="lv-eyebrow">First module · Aksh Diabetes</p>
            <h2 id="lv-diabetes-title" className="lv-h2 mt-3">
              Nine intelligence areas, one review queue.
            </h2>
          </div>
          <p className="lv-lede">
            Each area is a signal, not a separate agent. Together they feed HORIZON and GUARDIAN on the same
            orchestrator and audit trail. Rules-based on synthetic data today; insulin and GLP-1 are explanatory only,
            never an executable dose.
          </p>
        </div>

        <ul className="lv-cards lv-cards--3">
          {DIABETES_AREAS.map((a, i) => {
            const Icon = AREA_ICONS[a.name] ?? Activity;
            return (
            <li key={a.name} className="lv-card">
              <div className="lv-card__top">
                <span className="lv-spark" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="lv-card__num">{String(i + 1).padStart(3, "0")}</span>
              </div>
              <h3 className="lv-card__title">{a.name} Intelligence</h3>
              <p className="lv-card__sub">{a.output}</p>
              <p className="lv-card__body">{a.gate}</p>
              <span className={`lv-status lv-status--${a.status.tone} mt-4 self-start`}>{a.status.label}</span>
            </li>
            );
          })}
        </ul>
        <p className="lv-swipe-hint" aria-hidden>Swipe to see all nine →</p>
      </div>
    </section>
  );
}
