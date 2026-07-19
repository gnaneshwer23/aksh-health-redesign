"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AggregatesResponse = {
  modalitySampleCount?: number;
  learningEventCount?: number;
  consentGrantCount?: number;
  healthPlanCount?: number;
  recentEventTitles?: string[];
  patientIds?: string[];
  ehrWrite?: boolean;
  liveEmis?: boolean;
  physiologicalTwin?: boolean;
  note?: string;
  error?: string;
};

/**
 * ICS / hospital strip — same spine aggregates API as GP timeline stores.
 * Ops bed/PAS feeds remain mock; this is shared clinical events only.
 */
export function SpineSharedEventsPanel({
  title = "Shared clinical spine events",
  patientIds = ["P001", "P002"],
  demoPatientHref
}: {
  title?: string;
  patientIds?: string[];
  demoPatientHref?: string;
}) {
  const [data, setData] = useState<AggregatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ patientIds: patientIds.join(",") });
        const response = await fetch(`/api/clinical-spine/aggregates?${qs}`, {
          credentials: "include"
        });
        const json = (await response.json()) as AggregatesResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) {
          setData({ error: "Could not load spine aggregates.", ehrWrite: false, liveEmis: false });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientIds.join(",")]);

  return (
    <Card className="shadow-sm border-primary/15" data-testid="spine-shared-events">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-xs text-muted">
          Same modality / learning / consent / plan stores as GP timeline — not a parallel warehouse ·
          liveEmis:false · ehrWrite:false
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-2">
        {loading ? (
          <p className="text-xs text-muted">Loading shared spine aggregates…</p>
        ) : data?.error ? (
          <p className="text-xs text-muted">{data.error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-sm border border-border px-2 py-1.5">
                <p className="text-[10px] uppercase text-muted">Samples</p>
                <p className="text-lg font-semibold">{data?.modalitySampleCount ?? 0}</p>
              </div>
              <div className="rounded-sm border border-border px-2 py-1.5">
                <p className="text-[10px] uppercase text-muted">Learning</p>
                <p className="text-lg font-semibold">{data?.learningEventCount ?? 0}</p>
              </div>
              <div className="rounded-sm border border-border px-2 py-1.5">
                <p className="text-[10px] uppercase text-muted">Consent</p>
                <p className="text-lg font-semibold">{data?.consentGrantCount ?? 0}</p>
              </div>
              <div className="rounded-sm border border-border px-2 py-1.5">
                <p className="text-[10px] uppercase text-muted">Plans</p>
                <p className="text-lg font-semibold">{data?.healthPlanCount ?? 0}</p>
              </div>
            </div>
            {data?.recentEventTitles && data.recentEventTitles.length > 0 ? (
              <ul className="space-y-1 text-xs text-muted">
                {data.recentEventTitles.slice(0, 5).map((titleText) => (
                  <li key={titleText} className="truncate">
                    · {titleText}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No recent shared-spine events for cohort yet.</p>
            )}
            <p className="text-[11px] text-muted">{data?.note}</p>
            {demoPatientHref ? (
              <Link
                href={demoPatientHref}
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                Open demo patient timeline →
              </Link>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
