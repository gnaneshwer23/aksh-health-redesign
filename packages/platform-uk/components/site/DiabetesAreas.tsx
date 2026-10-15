import { AVAILABILITY_LABEL, DIABETES_AREAS, type Availability } from "@/components/site/vision";

/** Aksh Diabetes, split into what a care team can use today and what is in development. */
export function DiabetesAreas() {
  return (
    <div className="s-avail" data-diabetes-areas>
      {(["available", "development"] as Availability[]).map((a) => (
        <div key={a} className="s-avail__col" data-availability={a}>
          <span className="s-pillar__label">{AVAILABILITY_LABEL[a]}</span>
          {DIABETES_AREAS.filter((x) => x.availability === a).map((x) => (
            <div key={x.name} className="s-area">
              <h3 className="s-h3" style={{ fontSize: 18 }}>{x.name}</h3>
              <p className="s-small">{x.output}</p>
              <p className="s-area__gate">{x.safeguard}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
