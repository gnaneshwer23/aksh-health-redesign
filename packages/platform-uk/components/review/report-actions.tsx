"use client";

export function ReportActions({
  backHref,
  exportHref
}: {
  backHref: string;
  exportHref?: string;
}) {
  return (
    <div className="actions report-actions">
      <a className="button secondary" href={backHref}>
        Back
      </a>
      {exportHref ? (
        <a className="button secondary" href={exportHref} target="_blank">
          Export JSON
        </a>
      ) : null}
      <button
        className="button primary"
        onClick={() => {
          window.print();
        }}
        type="button"
      >
        Print / Save PDF
      </button>
    </div>
  );
}
