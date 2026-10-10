"use client";

import { useEffect, useState } from "react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

import { HitlActions } from "@/components/dashboard/SOAPEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReviewerIdentity } from "@/lib/hooks/use-reviewer-identity";
import type { PopulationData } from "@/lib/mock-data/types";
import type { Patient } from "@/lib/mock-data/types";
import {
  buildPatientRiskState,
  buildPopulationRiskState,
  type PatientRiskState,
} from "@/lib/precision-health/risk-state";

type DigitalTwinPanelProps =
  | { mode?: "patient"; patient: Patient | null; icsData?: never; readOnly?: boolean }
  | { mode: "ics"; patient?: never; icsData: PopulationData; readOnly?: boolean };

/**
 * @deprecated Name retained for import stability — UI labels say "risk state", not physiological twin.
 */
export function DigitalTwinPanel(props: DigitalTwinPanelProps) {
  return <PatientRiskStatePanel {...props} />;
}

export function PatientRiskStatePanel(props: DigitalTwinPanelProps) {
  const reviewer = useReviewerIdentity();
  const [accepted, setAccepted] = useState(false);
  const [apiRiskState, setApiRiskState] = useState<PatientRiskState | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const mode = props.mode ?? "patient";
  const readOnly = props.readOnly ?? false;

  useEffect(() => {
    if (mode !== "patient" || !props.patient?.id) {
      setApiRiskState(null);
      setApiLoaded(false);
      return;
    }
    const patientId = props.patient.id;
    let cancelled = false;
    setApiLoaded(false);

    async function loadRiskState() {
      try {
        const response = await fetch(`/api/patients/${encodeURIComponent(patientId)}/risk-state`, {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          riskState?: PatientRiskState;
          notAPhysiologicalTwin?: boolean;
        };
        if (cancelled || !data.riskState) return;
        if (data.notAPhysiologicalTwin === false) return;
        setApiRiskState(data.riskState);
      } catch {
        // Fall back to local risk-state builder below.
      } finally {
        if (!cancelled) setApiLoaded(true);
      }
    }

    void loadRiskState();
    return () => {
      cancelled = true;
    };
  }, [mode, props.patient?.id]);

  if (mode === "ics" && props.icsData) {
    const icsData = props.icsData;
    const highRisk = icsData.riskDistribution.high + icsData.riskDistribution.veryHigh;
    const highRiskSharePercent = Math.round((highRisk / icsData.totalPatients) * 100);
    const avgPredicted =
      icsData.admissionForecast.reduce((sum, d) => sum + d.predicted, 0) /
      Math.max(icsData.admissionForecast.length, 1);

    const riskState = buildPopulationRiskState({
      scopeLabel: icsData.icsName,
      highRiskSharePercent,
      signals: [
        `${icsData.guardianAlertsGenerated} GUARDIAN alerts across ${icsData.practices} practices`,
        `${icsData.equityFlags} COMPASS flags requiring regional-level review`,
        `Predicted daily admissions trending to ${Math.round(avgPredicted)} (14-day horizon)`,
        `${highRisk.toLocaleString()} patients in high/very-high risk tiers`
      ],
      recommendedActions: [
        "Deploy targeted outreach to Eastside Family Practice (lowest benchmark score)",
        "Increase extended-hours capacity in IMD Q1 areas via Valley View Surgery",
        "Review admission surge plan for predicted mid-July peak"
      ]
    });

    const chartData = [{ name: "risk", value: riskState.highRiskSharePercent, fill: "#E67E22" }];

    return (
      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm">Population risk state</CardTitle>
          <p className="text-xs text-muted">
            {riskState.scopeLabel} · risk-state model — not a physiological twin · read-only
          </p>
          <p className="text-[10px] text-muted">
            Recommend-stage illustration only — these actions are example copy, not derived from a
            computed Segment/Predict pipeline (Volume I FR-POP-013).
          </p>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-28 w-28">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={chartData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={4} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">{riskState.highRiskSharePercent}%</p>
              <p className="text-xs text-muted">High-risk population share (14-day window)</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">Population risk signals</p>
            <ul className="text-xs text-muted space-y-1">
              {riskState.signals.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">Recommended regional actions</p>
            {riskState.recommendedActions.map((a) => (
              <div key={a} className="mb-2 rounded-sm border border-border p-2 text-xs">
                <p>{a}</p>
                {readOnly && (
                  <p className="mt-1 text-muted text-[10px]">Read-only aggregate view. No HITL write-back.</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted leading-relaxed">{riskState.limitations[0]}</p>
        </CardContent>
      </Card>
    );
  }

  const patient = props.patient;
  if (!patient) {
    return <p className="text-sm text-muted">Select a patient for risk-state insights</p>;
  }

  const riskState = apiRiskState ?? buildPatientRiskState(patient);
  const data = [{ name: "risk", value: riskState.admissionRisk14Days, fill: "#003D7A" }];

  return (
    <Card className="shadow-sm" data-testid="patient-risk-state-panel">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">Patient risk state</CardTitle>
        <p className="text-xs text-muted">
          Risk-state model (HORIZON-style) — not a physiological digital twin
          {apiLoaded && apiRiskState ? " · loaded from risk-state API" : " · local demo model"}
        </p>
        {riskState.modelCard && (
          <p className="text-[10px] text-muted mt-1" data-testid="oracle-model-card">
            Model {riskState.modelCard.modelId}@{riskState.modelCard.version} · owner:{" "}
            {riskState.modelCard.clinicalOwner} · autoRetrain: false · see{" "}
            {riskState.modelCard.governedReleaseSop}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                data={data}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={4} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{riskState.admissionRisk14Days}%</p>
            <p className="text-xs text-muted">14-day admission risk</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Deterioration signals</p>
          <ul className="text-xs text-muted space-y-1">
            {riskState.deteriorationSignals.map((s) => (
              <li key={s}>• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Recommended actions</p>
          {riskState.recommendedActions.map((a) => (
            <div key={a} className="mb-2 rounded-sm border border-border p-2 text-xs">
              <p>{a}</p>
              {!accepted && !readOnly && (
                <div className="mt-2">
                  <HitlActions
                    status="Pending"
                    onAccept={() => setAccepted(true)}
                    onEdit={() => {}}
                    onReject={() => {}}
                  />
                </div>
              )}
              {accepted && (
                <p className="mt-1 text-accent text-[10px]">
                  Accepted for review queue · {reviewer.name} · no EHR write-back
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted leading-relaxed">{riskState.limitations[0]}</p>
      </CardContent>
    </Card>
  );
}
