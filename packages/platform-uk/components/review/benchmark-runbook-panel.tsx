import {
  benchmarkFailureTriage,
  benchmarkReadinessCriteria,
  benchmarkRunbookSteps
} from "@/lib/benchmark-runbook";

export function BenchmarkRunbookPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="panel stack">
      <div>
        <h2>Clinical Benchmark Runbook</h2>
        <p>Use this sequence when turning benchmark results into internal clinical validation evidence.</p>
      </div>
      <div className="list">
        {benchmarkRunbookSteps.map((step, index) => (
          <div className="row" key={step}>
            <div>
              <strong>Step {index + 1}</strong>
              <p>{step}</p>
            </div>
          </div>
        ))}
      </div>
      {!compact ? (
        <>
          <h3>Readiness Criteria</h3>
          <div className="signal-grid">
            {benchmarkReadinessCriteria.map((criterion) => (
              <div className="signal-card" key={criterion}>
                <strong>Criterion</strong>
                <p>{criterion}</p>
              </div>
            ))}
          </div>
          <h3>Failure Triage</h3>
          <div className="list">
            {benchmarkFailureTriage.map((item) => (
              <div className="row" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.guidance}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
