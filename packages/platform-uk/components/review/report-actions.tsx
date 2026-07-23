"use client";

export function ReportActions({
  backHref,
  exportHref,
  fhirExportHref
}: {
  backHref: string;
  exportHref?: string;
  fhirExportHref?: string;
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
      {fhirExportHref ? (
        <a className="button secondary" href={fhirExportHref} target="_blank" data-testid="report-download-fhir">
          Download FHIR Bundle
        </a>
      ) : null}
      <button
        className="button primary"
        onClick={() => {
          window.print();
        }}
        type="button"
        data-testid="report-print-pdf"
      >
        Print / Save PDF
      </button>
      <p className="text-xs text-slate-500" style={{ width: "100%", marginTop: "0.5rem" }}>
        Handoff only — FHIR Bundle / PDF are for demo filing stories. Not live EMIS write-back · liveEmis:false.
      </p>
    </div>
  );
}
