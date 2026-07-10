import type { CaseEvidencePayload } from "./case-evidence-types";

const jsonPreStyle = {
  margin: 0,
  padding: 16,
  borderRadius: 14,
  background: "#f5f7f4",
  overflowX: "auto" as const,
  border: "1px solid var(--line)"
};

export function CaseEvidenceValidationReportSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-12 panel stack">
      <h3>Validation Report</h3>
      <div className="list">
        {evidence.validationIssues.length ? (
          evidence.validationIssues.map((issue) => (
            <div className="row" key={issue.id}>
              <div>
                <strong>{issue.label}</strong>
                <p>{issue.detail}</p>
              </div>
              <span className={`tag ${issue.severity === "high" ? "danger" : issue.severity === "medium" ? "warn" : "ok"}`}>
                {issue.severity}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No structural validation issues</strong>
              <p>The current FHIR-shaped export is internally complete for this proof workflow.</p>
            </div>
            <span className="tag ok">valid</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceFhirExportBundleSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-12 panel stack">
      <h3>FHIR Export Bundle</h3>
      <div className="list">
        <div className="row">
          <div>
            <strong>Bundle metadata</strong>
            <p>
              {evidence.exportedResources.resourceType} {evidence.exportedResources.id} using export version{" "}
              {evidence.exportedResources.exportVersion}
            </p>
          </div>
          <span
            className={`tag ${
              evidence.exportedResources.summary.validationStatus === "valid"
                ? "ok"
                : evidence.exportedResources.summary.validationStatus === "blocking_issues"
                  ? "danger"
                  : "warn"
            }`}
          >
            {evidence.exportedResources.summary.validationStatus}
          </span>
        </div>
        <div className="row">
          <div>
            <strong>FHIR version</strong>
            <p>{evidence.exportedResources.fhirVersion}</p>
          </div>
          <span className="pill">{evidence.exportedResources.type}</span>
        </div>
        <div className="row">
          <div>
            <strong>Synthetic boundary</strong>
            <p>{evidence.exportedResources.summary.syntheticLabel}</p>
            <p>{evidence.exportedResources.summary.integrationReadinessLabel}</p>
          </div>
          <span className="tag warn">{evidence.exportedResources.integrationMode.replaceAll("_", " ")}</span>
        </div>
        <div className="row">
          <div>
            <strong>Export quality checks</strong>
            <p>
              {evidence.exportedResources.summary.validationIssueCount} issue(s):{" "}
              {evidence.exportedResources.summary.blockingIssueCount} blocking,{" "}
              {evidence.exportedResources.summary.warningIssueCount} warning.
            </p>
          </div>
          <span className="pill">{evidence.exportedResources.exportQualityIssues.length} detailed</span>
        </div>
        <div className="row">
          <div>
            <strong>Resource composition</strong>
            <p>{evidence.exportedResources.summary.resourceTypes.join(", ")}</p>
            <p>
              Per-resource checks:{" "}
              {evidence.exportedResources.summary.resourceValidation
                .map((item) => `${item.resourceReference} ${item.status.replaceAll("_", " ")}`)
                .join("; ")}
            </p>
          </div>
          <span className="pill">{evidence.exportedResources.summary.resourceCount} resources</span>
        </div>
      </div>
    </div>
  );
}

export function CaseEvidenceFieldChangesSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-12 panel stack">
      <h3>Field Changes</h3>
      <div className="list">
        {evidence.fieldChanges.length ? (
          evidence.fieldChanges.map((change) => (
            <div className="row" key={change.id}>
              <div>
                <strong>{change.fieldLabel}</strong>
                <p>{change.sectionId}</p>
                <p>
                  From: "{change.oldValue || "empty"}" To: "{change.newValue || "empty"}"
                </p>
              </div>
              <span className="meta">
                {change.actor}
                <br />
                {change.timestamp}
              </span>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No field changes recorded</strong>
              <p>The current draft matches the latest stored values without explicit edit history yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceSourceTraceSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-12 panel stack">
      <h3>Source To Draft Trace</h3>
      <div className="list">
        {evidence.sourceTrace.map((item) => (
          <div className="row" key={item.step}>
            <div>
              <strong>{item.step}</strong>
              <p>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseEvidenceGenerationTraceSection({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <div className="span-12 panel stack">
      <h3>Generation Trace</h3>
      <div className="list">
        {evidence.generationTrace.length ? (
          evidence.generationTrace.map((item) => (
            <div className="row" key={item.id}>
              <div>
                <strong>{item.fieldLabel}</strong>
                <p>Source: {item.sourceSnippet}</p>
                <p>Target: {item.fieldPath}</p>
                <p>Output: {item.inferredValue}</p>
                <p>{item.rationale}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="row">
            <div>
              <strong>No generation trace recorded</strong>
              <p>This case predates the explainable intake flow or was created outside the current intake pathway.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CaseEvidenceFhirJsonSections({ evidence }: { evidence: CaseEvidencePayload }) {
  return (
    <>
      <div className="span-12 panel stack">
        <h3>FHIR Export Mapping</h3>
        <pre style={jsonPreStyle}>{JSON.stringify(evidence.exportedResources, null, 2)}</pre>
      </div>

      <div className="span-12 panel stack">
        <h3>FHIR Draft Snapshot</h3>
        <pre style={jsonPreStyle}>{JSON.stringify(evidence.draft, null, 2)}</pre>
      </div>
    </>
  );
}
