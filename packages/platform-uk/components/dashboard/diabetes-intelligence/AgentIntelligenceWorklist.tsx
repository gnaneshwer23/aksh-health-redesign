"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { AgentIntelWorklistItem } from "@/lib/diabetes-intelligence/agent-intel-types";

type Props = {
  endpoint: "/api/gp/agent-intelligence/worklist";
  title: string;
};

export function AgentIntelligenceWorklist({ endpoint, title }: Props) {
  const [items, setItems] = useState<AgentIntelWorklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { credentials: "include" });
      const data = (await res.json()) as {
        items?: AgentIntelWorklistItem[];
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
        <p style={eyebrow}>Agent intelligence · Phase 5 · synthetic_demo</p>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 650, color: "#0f2744" }}>{title}</h1>
        <p style={{ margin: 0, color: "#4a6278", lineHeight: 1.5, maxWidth: 560 }}>
          AI-generated drafts awaiting clinician Accept/Edit/Reject. Provenance labelled; not
          verified clinical information until decided. No EHR write.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
          <Link href="/dashboard/gp/patients/P002/agent-intelligence">
            <Button variant="outline">Open P002 workspace</Button>
          </Link>
        </div>
      </header>

      {loading ? (
        <p style={{ color: "#5a738a" }}>Loading worklist…</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#5a738a" }}>
          No open AI drafts. Open{" "}
          <Link href="/dashboard/gp/patients/P002/agent-intelligence">P002 workspace</Link> and run
          orchestration.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/gp/patients/${encodeURIComponent(item.patientId)}/agent-intelligence`}
              style={row}
            >
              <div>
                <strong style={{ color: "#0f2744" }}>{item.patientLabel}</strong>
                <div style={{ fontSize: 13, color: "#5a738a", marginTop: 4 }}>
                  {item.kind} · {item.title}
                </div>
                <div style={{ fontSize: 12, color: "#7a90a4", marginTop: 4 }}>
                  status={item.status} · provenance={item.provenance} · verified=
                  {String(item.verifiedClinical)} · confidence={item.confidence}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#5a738a" }}>Review →</span>
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
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#5a738c",
  fontWeight: 600,
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: 14,
  background: "#fff",
  border: "1px solid #d8e2ec",
  borderRadius: 8,
  textDecoration: "none",
};
