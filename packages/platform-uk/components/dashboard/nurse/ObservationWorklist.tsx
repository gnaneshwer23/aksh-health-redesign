"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorklistItem = {
  id: string;
  patientId: string | null;
  summary: string;
  priority: string;
  careEpisodeId: string | null;
  slotId: string | null;
  at: string;
  source: string;
};

/**
 * P2 — nurse visibility for booking → nurse_observation handoff.
 * Reads /api/nurse/observation-worklist (not Front Desk-only UI).
 */
export function ObservationWorklist() {
  const { status } = useSession();
  const [items, setItems] = useState<WorklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nurse/observation-worklist", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        setError(`Worklist unavailable (${res.status})`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items?: WorklistItem[] };
      setItems(data.items ?? []);
    } catch {
      setError("Could not load observation worklist.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <Card className="dashboard-card border-0 shadow-none" data-testid="nurse-observation-worklist">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-secondary">Observation worklist</CardTitle>
        <p className="text-xs text-muted">
          Open nurse observations from verified Front Desk bookings · care episode id when correlated ·
          synthetic · liveEmis:false
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {status !== "authenticated" ? (
          <p className="text-sm text-muted">Sign in to see booking→nurse observation tasks.</p>
        ) : loading && items.length === 0 ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : error ? (
          <p className="text-sm text-muted">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No open observation tasks from bookings.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-md border border-border/60 px-3 py-2 text-sm">
                <div className="font-medium text-foreground">{item.summary}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  <span>Priority: {item.priority}</span>
                  {item.patientId ? <span>Patient: {item.patientId}</span> : null}
                  {item.careEpisodeId ? (
                    <span data-testid="nurse-worklist-episode">Episode: {item.careEpisodeId}</span>
                  ) : (
                    <span>Episode: not linked</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/nurse/observations">Record vitals</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
