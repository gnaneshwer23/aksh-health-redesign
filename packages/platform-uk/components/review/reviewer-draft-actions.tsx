import type { ReviewerDraftAction } from "@/lib/types";

function actionTone(status: ReviewerDraftAction["status"], severity: ReviewerDraftAction["severity"]) {
  if (status === "confirmed") {
    return "ok";
  }

  if (severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warn";
  }

  return "ok";
}

export function ReviewerDraftActions({
  actions,
  title = "Draft Action Suggestions",
  intro,
  className,
  variant = "panel"
}: {
  actions: ReviewerDraftAction[];
  title?: string;
  intro?: string;
  className?: string;
  variant?: "panel" | "report";
}) {
  const wrapperClassName = [variant === "report" ? "report-section" : "panel stack", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={wrapperClassName}>
      <h3>{title}</h3>
      <p>
        {intro ??
          "Actionable reviewer-owned next steps derived from current safety, validation, and governance signals. Checklist completion is the human-confirmation record."}
      </p>
      <div className="list">
        {actions.length ? (
          actions.map((action) => (
            <div className="row" key={action.id}>
              <div>
                <strong>{action.title}</strong>
                <p>{action.actionLabel}</p>
                <p>{action.instruction}</p>
                <p>
                  {action.actionType ? `${action.actionType.replaceAll("_", " ")} · ` : ""}
                  {action.category.replaceAll("_", " ")}
                </p>
                <p>
                  {action.status === "confirmed"
                    ? `Confirmed by ${action.completedBy ?? "reviewer"} at ${action.completedAt ?? "unknown time"}${action.confirmationNote?.trim() ? ` · ${action.confirmationNote}` : ""}`
                    : action.confirmationNote?.trim()
                      ? `Draft note: ${action.confirmationNote}`
                      : "No human confirmation recorded yet."}
                </p>
              </div>
              <span className={`tag ${actionTone(action.status, action.severity)}`}>
                {action.status === "confirmed" ? "confirmed" : "needs confirmation"}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No draft actions suggested</strong>
              <p>No reviewer-owned action suggestions are currently derived for this case.</p>
            </div>
            <span className="tag ok">clear</span>
          </div>
        )}
      </div>
    </section>
  );
}
