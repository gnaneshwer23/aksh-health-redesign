"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { GlucoseWorklistItem } from "@/lib/diabetes-intelligence/glucose-types";

export function DiabetesGlucoseWorklist() {
  const [items, setItems] = useState<GlucoseWorklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gp/diabetes-intelligence/worklist", {
        credentials: "include",
      });
      const data = (await res.json()) as {
        items?: GlucoseWorklistItem[];
        error?: string;
        synthetic?: boolean;
      };
      if (!res.ok) {
        toast({ title: "Worklist unavailable", description: data.error ?? "Could not load." });
        return;
      }
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 960 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <p style={eyebrow}>Review worklist · Phase 2 · synthetic</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 650, color: "#0f2744" }}>
          Diabetes glucose intelligence
        </h1>
        <p style={{ margin: 0, color: "#4a6278", lineHeight: 1.5, maxWidth: 560 }}>
          Ranked by hypoglycaemia risk, data gaps, then HbA1c trend. Not a real-time alarm. Seed a
          patient workspace to populate the list.
        </p>
        <div>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>
      </header>

      {loading ? (
        <p style={{ color: "#5a738a" }}>Loading worklist…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#5a738a" }}>
          No seeded glucose series yet. Open{" "}
          <Link href="/dashboard/gp/patients/P002/diabetes-intelligence">P002 workspace</Link> and
          seed synthetic data.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <Link
              key={item.patientId}
              href={`/dashboard/gp/patients/${encodeURIComponent(item.patientId)}/diabetes-intelligence`}
              style={row}
            >
              <div>
                <strong style={{ color: "#0f2744" }}>{item.patientLabel}</strong>
                <div style={{ fontSize: 13, color: "#5a738a", marginTop: 4 }}>
                  urgency {item.urgency}
                  {item.tirPercent != null ? ` · TIR ${item.tirPercent.toFixed(1)}%` : ""}
                  {` · HbA1c ${item.hba1cTrend.replace(/_/g, " ")}`}
                  {item.latestHba1cMmolMol != null
                    ? ` (${item.latestHba1cMmolMol} mmol/mol)`
                    : ""}
                  {item.pendingReviewId ? " · draft pending sign-off" : ""}
                </div>
                {item.flags[0] && (
                  <div style={{ fontSize: 13, color: "#3d556b", marginTop: 4 }}>{item.flags[0]}</div>
                )}
              </div>
              <span style={{ color: "#1d6f8a", fontSize: 13 }}>Open →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const eyebrow: CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "#5a738a",
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 14,
  background: "#fff",
  border: "1px solid #d7e2ec",
  borderRadius: 12,
  textDecoration: "none",
};
