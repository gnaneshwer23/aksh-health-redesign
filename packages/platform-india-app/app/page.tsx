import Link from "next/link";

import { hi } from "@/lib/i18n/hi";

export default function HomePage() {
  return (
    <section className="stack">
      <div className="panel stack">
        <h2>{hi.home.title}</h2>
        <p className="muted">{hi.home.subtitle}</p>
        <p className="muted">{hi.home.safetyRef}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="button" href="/intake">
            {hi.nav.intake}
          </Link>
          <Link className="button" href="/review">
            {hi.nav.review}
          </Link>
        </div>
      </div>
      <p className="muted">
        Strategy:{" "}
        <a href="https://github.com/akshhealth/akshhealth-india-web/blob/main/docs/INDIA_TECH_BUILD_STRATEGY.md">
          INDIA_TECH_BUILD_STRATEGY.md
        </a>{" "}
        (local copy in akshhealth-india-web/docs/)
      </p>
    </section>
  );
}
