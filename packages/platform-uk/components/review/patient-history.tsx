"use client";

import { useEffect, useState } from "react";

export function PatientHistory({ patientLabel }: { patientLabel: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // In a real application, this would call a Next.js API route that securely calls `fetchPatientHistory`
    // For this pilot UI, we'll simulate the fetch or use a lightweight proxy if needed.
    // To keep it clean, we'll just mock the visual UI of longitudinal records here to show the clinician.
    
    setIsLoading(true);
    // Simulate network delay for an integration-rehearsal history panel.
    setTimeout(() => {
      setHistory([
        {
          id: "enc-1",
          resourceType: "Encounter",
          status: "finished",
          class: { display: "Ambulatory" },
          period: { start: "2026-03-12T09:00:00Z" },
          reasonCode: [{ text: "Routine Follow-up (Hypertension)" }]
        },
        {
          id: "enc-2",
          resourceType: "Encounter",
          status: "finished",
          class: { display: "Ambulatory" },
          period: { start: "2025-11-04T14:30:00Z" },
          reasonCode: [{ text: "Initial Presentation (Elevated BP)" }]
        }
      ]);
      setIsLoading(false);
    }, 800);
  }, [patientLabel]);

  return (
    <div className="panel stack" style={{ background: "var(--panel-alt)", borderLeft: "4px solid var(--accent)", boxShadow: "none" }}>
      <div className="row" style={{ alignItems: "baseline" }}>
        <h3 style={{ margin: 0 }}>Longitudinal History (Integration Rehearsal)</h3>
        <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Synthetic Preview</span>
      </div>
      
      {isLoading ? (
        <p className="meta">Preparing synthetic longitudinal context for {patientLabel}...</p>
      ) : error ? (
        <p className="meta" style={{ color: "var(--danger)" }}>{error}</p>
      ) : history.length > 0 ? (
        <div className="list">
          {history.map((record) => (
            <div className="row" key={record.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
              <div>
                <strong>{record.reasonCode?.[0]?.text || "Clinical Encounter"}</strong>
                <p className="meta">{new Date(record.period?.start).toLocaleDateString("en-GB")} · {record.class?.display}</p>
              </div>
              <span className="tag ok">{record.status}</span>
            </div>
          ))}
          <p className="meta" style={{ fontSize: "0.8em", marginTop: "8px" }}>Synthetic historical data shown for integration rehearsal. Not editable.</p>
        </div>
      ) : (
        <p className="meta">No previous FHIR records found for this patient.</p>
      )}
    </div>
  );
}
