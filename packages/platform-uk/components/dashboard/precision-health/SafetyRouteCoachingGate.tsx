"use client";

import { useEffect, useState } from "react";

import { CoachingDraftPanel } from "@/components/dashboard/precision-health/CoachingDraftPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SafetyRoute } from "@/lib/clinical-spine/safety-route";

type SafetyRouteResponse = {
  safetyRoute?: SafetyRoute;
  title?: string;
  patientMessage?: string;
  coachingAllowed?: boolean;
  guardianStatus?: string | null;
  oracleRisk?: string | null;
  ehrWrite?: boolean;
  error?: string;
};

/**
 * Phase C — safety route gate for patient companion coaching.
 * Low-risk → coaching; clinical/urgent → message only (no coaching generators).
 */
export function SafetyRouteCoachingGate({
  patientId,
  patientLabel,
  mode = "patient",
}: {
  patientId: string;
  patientLabel?: string;
  mode?: "patient" | "clinician";
}) {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<SafetyRouteResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const response = await fetch(
          `/api/patients/${encodeURIComponent(patientId)}/safety-route`,
          { credentials: "include" }
        );
        const data = (await response.json()) as SafetyRouteResponse;
        if (cancelled) return;
        if (!response.ok) {
          setRoute({
            safetyRoute: "clinical_review_queue",
            title: "Clinician review",
            patientMessage:
              data.error ??
              "Safety route unavailable — coaching paused until a clinician reviews.",
            coachingAllowed: false,
          });
          return;
        }
        setRoute(data);
      } catch {
        if (!cancelled) {
          setRoute({
            safetyRoute: "clinical_review_queue",
            coachingAllowed: false,
            patientMessage: "Could not resolve safety route. Coaching paused.",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading) {
    return (
      <Card className="shadow-sm" data-testid="safety-route-coaching-gate">
        <CardContent className="p-4 text-xs text-muted">Resolving safety route…</CardContent>
      </Card>
    );
  }

  const allowed = route?.coachingAllowed === true && route.safetyRoute === "low_risk_coaching";
  const urgent = route?.safetyRoute === "urgent_flag";

  return (
    <div className="space-y-3" data-testid="safety-route-coaching-gate">
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Safety route</CardTitle>
          <p className="text-xs text-muted">
            {route?.title ?? route?.safetyRoute ?? "unknown"}
            {route?.guardianStatus ? ` · GUARDIAN ${route.guardianStatus}` : ""}
            {route?.oracleRisk ? ` · ORACLE ${route.oracleRisk}` : ""}
            {" · "}ehrWrite: false
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p
            className={`rounded-md px-3 py-2 text-xs ${
              urgent
                ? "bg-danger/10 text-danger"
                : allowed
                  ? "bg-muted/50 text-muted"
                  : "bg-warning/10 text-warning"
            }`}
            data-testid="safety-route-message"
          >
            {route?.patientMessage ??
              (allowed
                ? "Low-risk branch — coaching drafts available (not clinical advice)."
                : "Clinical or urgent branch — coaching paused; clinician review applies.")}
          </p>
        </CardContent>
      </Card>

      {allowed ? (
        <CoachingDraftPanel patientId={patientId} patientLabel={patientLabel} mode={mode} />
      ) : (
        <Card className="shadow-sm" data-testid="coaching-paused-notice">
          <CardContent className="space-y-1 p-4 text-xs text-muted">
            <p className="font-semibold text-foreground">Wellness coaching paused</p>
            <p>
              Nutrition / sleep / exercise / mental-health drafts appear only on the low-risk safety
              branch. Clinical and urgent cases stay with clinician HITL review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
