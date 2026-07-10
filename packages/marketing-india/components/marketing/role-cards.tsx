import Link from "next/link";

import type { RoleCard, SectionBlock } from "@/content/india-marketing";

export function RoleCards({
  section,
  roles,
}: {
  section: SectionBlock;
  roles: RoleCard[];
}) {
  return (
    <section className="product-section" aria-labelledby="roles-heading">
      <div className="product-section-head">
        <p className="product-kicker">{section.kicker}</p>
        <h2 id="roles-heading">{section.title}</h2>
        <p>{section.description}</p>
      </div>
      <div className="lp-roles-grid">
        {roles.map((role) => (
          <article className="lp-role-card" key={role.role}>
            <div className="lp-role-card__body">
              <p className="product-kicker">{role.role}</p>
              <h3>{role.promise}</h3>
              <p>{role.detail}</p>
            </div>
            <Link
              className={`product-button ${role.primary ? "product-button--primary" : "product-button--secondary"}`}
              href={role.href}
            >
              {role.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
