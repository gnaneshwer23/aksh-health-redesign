import Link from "next/link";

export function ProofEmptyState({
  actionHref,
  actionLabel,
  detail,
  status = "empty",
  title
}: {
  actionHref?: string;
  actionLabel?: string;
  detail: string;
  status?: "empty" | "warn" | "clear";
  title: string;
}) {
  const tagClass = status === "clear" ? "ok" : status === "warn" ? "warn" : "warn";

  return (
    <div className="row" data-testid="proof-empty-state">
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <div className="actions">
        <span className={`tag ${tagClass}`}>{status}</span>
        {actionHref && actionLabel ? (
          <Link className="button secondary" href={actionHref}>
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
