"use client";

import { useEffect, useMemo, useState } from "react";

import { Neo4jMockModeBanner } from "@/components/dashboard/Neo4jMockModeBanner";
import { ReviewQueueItem } from "@/components/dashboard/ReviewQueueItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNeo4jGuardian } from "@/lib/hooks/use-neo4j-clinical";
import { useUserProfile } from "@/lib/hooks/use-user-profile";
import { patients } from "@/lib/mock-data";
import { buildEmptyStateMessage, filterByOrg, getPharmacyLabel } from "@/lib/profile/personalization";
import { useDashboardStore } from "@/lib/zustand/dashboardStore";

const PHARMACIST_ACCENT = "text-[#6B46C1]";

type DurableReview = {
  id: string;
  recordedAt: string;
  actor: string;
  label: string;
  detail: string | null;
  resourceRef: string | null;
};

function PatientGuardianHint({ patientId }: { patientId: string }) {
  const { data, loading, source } = useNeo4jGuardian(patientId);
  if (loading) return <p className="text-xs text-muted">Loading graph interactions…</p>;
  const count = data?.interactions.length ?? 0;
  return (
    <p className="text-xs text-muted">
      GUARDIAN ({source ?? "unknown"}): {count === 0 ? "no pairs flagged" : `${count} interaction pair(s)`}
      {data?.overallStatus ? ` · status ${data.overallStatus}` : ""}
    </p>
  );
}

export function MedReviewQueue() {
  const { medicationReviewsCompleted, markMedicationReviewed, reviewQueueItems } = useDashboardStore();
  const { profile } = useUserProfile();
  const pharmacyLabel = getPharmacyLabel(profile);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [durableReviews, setDurableReviews] = useState<DurableReview[]>([]);
  const [durableSource, setDurableSource] = useState<"postgres" | "unavailable" | "loading">("loading");

  const medQueue = useMemo(() => {
    const polypharmacyPatients = patients.filter((p) => p.activeMedications.length >= 2);
    return filterByOrg(polypharmacyPatients, profile?.organisation);
  }, [profile?.organisation]);

  const samplePatientId = medQueue[0]?.id ?? "P002";
  const { source: neo4jSource, loading: neo4jLoading } = useNeo4jGuardian(samplePatientId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/pharmacist/reviews?limit=20", { credentials: "include" });
        if (!response.ok) throw new Error("reviews fetch failed");
        const data = (await response.json()) as {
          durable?: boolean;
          reviews?: DurableReview[];
        };
        if (cancelled) return;
        setDurableReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setDurableSource(data.durable ? "postgres" : "unavailable");
      } catch {
        if (!cancelled) {
          setDurableReviews([]);
          setDurableSource("unavailable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [medicationReviewsCompleted.length]);

  return (
    <section>
      <h2 className={`text-lg font-semibold mb-1 ${PHARMACIST_ACCENT}`}>
        Medication Review Queue <Badge className="bg-[#6B46C1] text-white">{medQueue.length}</Badge>
      </h2>
      <p className="mb-3 text-sm text-muted">Reviews scoped to {pharmacyLabel}</p>
      <Neo4jMockModeBanner source={neo4jSource} loading={neo4jLoading} showLive />

      <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        {durableSource === "loading"
          ? "Loading durable pharmacist reviews…"
          : durableSource === "postgres"
            ? durableReviews.length === 0
              ? "Durable SHIELD trail live — no pharmacist medication reviews recorded yet."
              : `${durableReviews.length} durable pharmacist review(s) in SHIELD audit.`
            : "Durable review trail unavailable — Mark Reviewed still works locally and best-effort audits when signed in."}
        {durableReviews.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {durableReviews.slice(0, 5).map((r) => (
              <li key={r.id}>
                {new Date(r.recordedAt).toLocaleString("en-GB")} · {r.resourceRef ?? r.label}
                {r.detail ? ` — ${r.detail}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {medQueue.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-sm text-muted">
          {buildEmptyStateMessage(profile, "medication reviews", "No patients awaiting medication review.")}
        </p>
      ) : (
        <div className="space-y-2">
          {medQueue.map((p) => (
            <Card key={p.id} className="shadow-sm border-[#6B46C1]/10">
              <CardHeader className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">{p.name}</CardTitle>
                  <Badge variant="outline" className="border-[#6B46C1]/30 text-[#6B46C1]">
                    {p.activeMedications.length} meds
                  </Badge>
                </div>
                <p className="text-xs text-muted">Last review: {p.lastEncounterDate}</p>
              </CardHeader>
              {expanded === p.id && (
                <CardContent className="p-4 pt-0 space-y-2">
                  <PatientGuardianHint patientId={p.id} />
                  <ul className="text-xs">
                    {p.activeMedications.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                  {reviewQueueItems
                    .filter((r) => r.patientId === p.id && r.agentType === "GUARDIAN")
                    .map((r) => (
                      <ReviewQueueItem key={r.id} item={r} />
                    ))}
                  <Button
                    size="sm"
                    className="bg-[#6B46C1] hover:bg-[#6B46C1]/90"
                    disabled={medicationReviewsCompleted.includes(p.id)}
                    data-testid="pharmacist-mark-reviewed"
                    onClick={async () => {
                      markMedicationReviewed(p.id);
                      try {
                        const response = await fetch("/api/clinical-spine/pharmacist-review", {
                          method: "POST",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            patientId: p.id,
                            patientLabel: p.name,
                            medicationCount: p.activeMedications.length,
                            medicationSummary: `${p.activeMedications.length} active medications reviewed`
                          })
                        });
                        if (response.ok) {
                          const listed = await fetch("/api/pharmacist/reviews?limit=20", {
                            credentials: "include"
                          });
                          if (listed.ok) {
                            const data = (await listed.json()) as {
                              reviews?: DurableReview[];
                              durable?: boolean;
                            };
                            setDurableReviews(Array.isArray(data.reviews) ? data.reviews : []);
                            setDurableSource(data.durable ? "postgres" : "unavailable");
                          }
                        }
                      } catch {
                        // Local mark still applies; durable spine write is best-effort.
                      }
                    }}
                  >
                    {medicationReviewsCompleted.includes(p.id) ? "Reviewed ✓" : "Mark Reviewed"}
                  </Button>
                  <p className="text-[11px] text-muted" data-testid="pharmacist-spine-note">
                    Mark Reviewed → SHIELD + learning event on the same patient timeline as GP ·
                    HITL · ehrWrite:false · liveEmis:false
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
