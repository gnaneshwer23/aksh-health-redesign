/**
 * Pharma / payer integration stubs — Phase 3 scaffolding.
 * Read-only placeholders. Not a live payer or pharma pipe.
 */

export type PharmaRweSummary = {
  artifactType: "aksh-pharma-rwe-placeholder";
  livePharmaIntegration: false;
  note: string;
  syntheticCohortLabel: string;
  endpoints: Array<{
    id: string;
    label: string;
    valueText: string;
    source: "synthetic_ics_aggregate";
  }>;
  limitations: string[];
  ehrWrite: false;
  generatedAt: string;
};

export type PayerVbcMetrics = {
  artifactType: "aksh-payer-vbc-placeholder";
  livePayerIntegration: false;
  note: string;
  syntheticIcsLabel: string;
  metrics: Array<{
    id: string;
    label: string;
    valueText: string;
    source: "synthetic_ics_aggregate";
  }>;
  limitations: string[];
  ehrWrite: false;
  generatedAt: string;
};

export function getPharmaRweSummary(): PharmaRweSummary {
  return {
    artifactType: "aksh-pharma-rwe-placeholder",
    livePharmaIntegration: false,
    note: "Not a live payer/pharma integration — RWE summary placeholder from synthetic aggregates.",
    syntheticCohortLabel: "Synthetic HF pathway cohort (rehearsal)",
    endpoints: [
      {
        id: "hf-readmission-30d",
        label: "30-day HF readmission (synthetic)",
        valueText: "12.4% (n=1,240 synthetic)",
        source: "synthetic_ics_aggregate"
      },
      {
        id: "gdmt-optimisation",
        label: "GDMT optimisation rate (synthetic)",
        valueText: "61% of eligible synthetic patients",
        source: "synthetic_ics_aggregate"
      },
      {
        id: "rwe-exposure",
        label: "Drug exposure linkage",
        valueText: "Not linked — placeholder only",
        source: "synthetic_ics_aggregate"
      }
    ],
    limitations: [
      "Placeholder only — no pharma contract, no secondary-use DPIA for commercial RWE.",
      "Figures are synthetic regional aggregates, not real-world evidence.",
      "ehrWrite: false."
    ],
    ehrWrite: false,
    generatedAt: new Date().toISOString()
  };
}

export function getPayerVbcMetrics(): PayerVbcMetrics {
  return {
    artifactType: "aksh-payer-vbc-placeholder",
    livePayerIntegration: false,
    note: "Not a live payer/pharma integration — value-based care metrics from synthetic regional aggregates.",
    syntheticIcsLabel: "Synthetic regional rehearsal",
    metrics: [
      {
        id: "avoidable-admissions",
        label: "Avoidable admissions index (synthetic)",
        valueText: "0.82 vs regional baseline 1.00",
        source: "synthetic_ics_aggregate"
      },
      {
        id: "equity-gap",
        label: "IMD Q1 vs Q5 outcome gap (synthetic)",
        valueText: "14 pp absolute gap",
        source: "synthetic_ics_aggregate"
      },
      {
        id: "contract-status",
        label: "Payer contract status",
        valueText: "None — stub API only",
        source: "synthetic_ics_aggregate"
      }
    ],
    limitations: [
      "Placeholder only — no ICB / insurer API, no claims feed.",
      "Not usable for tariff negotiation or shared-savings settlement.",
      "ehrWrite: false."
    ],
    ehrWrite: false,
    generatedAt: new Date().toISOString()
  };
}
