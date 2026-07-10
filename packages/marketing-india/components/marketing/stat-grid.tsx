import type { Stat } from "@/content/india-marketing";

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <section className="product-stat-grid" aria-label="Proof metrics">
      {stats.map((stat) => (
        <article className="product-stat" key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
          <p>{stat.detail}</p>
        </article>
      ))}
    </section>
  );
}
