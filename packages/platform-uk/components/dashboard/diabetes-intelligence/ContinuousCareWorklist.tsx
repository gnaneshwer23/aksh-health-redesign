"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { ContinuousCareWorklistItem } from "@/lib/diabetes-intelligence/continuous-care-types";

type Props = {
  /** API path for the worklist */
  endpoint: "/api/gp/continuous-care/worklist" | "/api/nurse/continuous-care/worklist";
  title: string;
  roleLabel: string;
};

export function ContinuousCareWorklist({ endpoint, title, roleLabel }: Props) {
  const [items, setItems] = useState<ContinuousCareWorklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      const data = (await res.json()) as {
        items?: ContinuousCareWorklistItem[];
        error?: string;
      };
      if (!res.ok) {
        toast({ title: "Worklist unavailable", description: data.error ?? "Could not load." });
        return;
      }
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 960 }}>
      <header style={{ display: "grid", gap: 8 }}>
        <p style={eyebrow}>Continuous care · Phase 4 · synthetic · {roleLabel}</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 650, color: "#0f2744" }}>{title}</h1>
        <p style={{ margin: 0, color: "#4a6278", lineHeight: 1.5, maxWidth: 560 }}>
          Follow-ups, escalations, and patient-reported updates ranked by urgency. HITL preserved —
          no autonomous clinical actions. Seed a patient workspace to populate the list.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
          <Link href="/dashboard/gp/patients/P002/continuous-care">
            <Button variant="outline">Open P002 continuous care</Button>
          </Link>
        </div>
      </header>

      {loading ? (
        <p style={{ color: "#5a738a" }}>Loading worklist…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#5a738a" }}>
          No open continuous-care items. Open{" "}
          <Link href="/dashboard/gp/patients/P002/continuous-care">P002 workspace</Link> and seed
          synthetic data.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              href={`/dashboard/gp/patients/${encodeURIComponent(item.patientId)}/continuous-care`}
              style={row}
            >
              <div>
                <strong style={{ color: "#0f2744" }}>{item.patientLabel}</strong>
                <div style={{ fontSize: 13, color: "#5a738a", marginTop: 4 }}>
                  {item.kind} · urgency {item.worklistUrgency} · {item.priority} · {item.status} ·
                  owner {item.ownerRole}
                </div>
                <div style={{ fontSize: 13, color: "#3d556b", marginTop: 4 }}>{item.title}</div>
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
