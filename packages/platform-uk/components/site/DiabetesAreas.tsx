import { DIABETES_AREAS } from "@/components/site/vision";
import { StatusLegend, StatusPill } from "@/components/site/StatusPill";

/** Aksh Diabetes: each capability with its status (from the capability register) and its safeguard. */
export function DiabetesAreas() {
  return (
    <div data-diabetes-areas>
      <StatusLegend only={["production", "in_validation"]} />
      <div className="s-areas" style={{ marginTop: 14 }}>
        {DIABETES_AREAS.map((x) => (
          <div key={x.id} className="s-area" data-status={x.status}>
            <div className="s-row"><h3 className="s-h3" style={{ fontSize: 18 }}>{x.name}</h3><StatusPill s={x.status} /></div>
            <p className="s-small">{x.detail}</p>
            <p className="s-area__gate">{x.safeguard}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
