/**
 * Evidence helper — Precision Health scaffold honesty snapshot for evidence:pack.
 * Prints a single JSON object to stdout. Never invents liveEmis or physiologicalTwin.
 */

import {
  getCausalAiStatus,
  getEmisPartnerChecklist,
  getFederatedResearchStatus,
  getOracleModelCard,
  getPharmaRweSummary,
  getPayerVbcMetrics,
  getTwinSimulationStatus,
  listConnectorStatuses,
  listModalityContractSummaries
} from "../lib/precision-health";
import { getMedplumRehearsalStatus } from "../lib/medplum-client";

const connectors = listConnectorStatuses();
const liveStreamConnectors = connectors.filter((c) => c.liveStream).map((c) => c.id);
const fitbit = connectors.find((c) => c.id === "fitbit_oauth_stub");
const twin = getTwinSimulationStatus();
const emis = getEmisPartnerChecklist();
const medplum = getMedplumRehearsalStatus();

const snapshot = {
  artifactType: "aksh-uk-precision-health-scaffold-snapshot",
  generatedAt: new Date().toISOString(),
  liveEmis: false as const,
  liveWriteBack: false as const,
  physiologicalTwin: false as const,
  simulationMode: twin.simulationMode,
  connectors: {
    count: connectors.length,
    liveStreamIds: liveStreamConnectors,
    fitbitLiveStream: fitbit?.liveStream ?? false,
    fitbitNote:
      fitbit && !fitbit.liveStream
        ? "Fitbit stub disabled without FITBIT_CLIENT_ID/SECRET — no invented device reads"
        : "Fitbit env present; ingest still does not invent live API pulls"
  },
  modalities: listModalityContractSummaries().map((m) => m.id),
  emisPartnerChecklist: {
    liveEmis: emis.liveEmis,
    itemStatuses: emis.items.map((i) => ({ id: i.id, status: i.status }))
  },
  medplum: {
    syncFlagEnabled: medplum.syncFlagEnabled,
    mode: medplum.mode,
    liveEmis: medplum.liveEmis,
    dryRunEligible: medplum.dryRunEligible,
    note: medplum.note
  },
  oracleModelCard: {
    modelId: getOracleModelCard().modelId,
    clinicalOwner: getOracleModelCard().clinicalOwner,
    autoRetrain: getOracleModelCard().autoRetrain
  },
  causal: getCausalAiStatus(),
  federated: getFederatedResearchStatus(),
  pharmaPayer: {
    livePharmaIntegration: getPharmaRweSummary().livePharmaIntegration,
    livePayerIntegration: getPayerVbcMetrics().livePayerIntegration
  },
  uiSurfaces: [
    "app/dashboard/admin/precision-health/page.tsx",
    "components/dashboard/precision-health/ConnectorsIngestPanel.tsx",
    "components/dashboard/precision-health/CausalHypothesisPanel.tsx",
    "components/dashboard/precision-health/ScenarioRankingPanel.tsx",
    "components/dashboard/precision-health/FederatedJobsPanel.tsx",
    "components/dashboard/precision-health/PharmaPayerStubPanel.tsx",
    "components/dashboard/precision-health/CoachingDraftPanel.tsx"
  ],
  note: "Scaffolding only — partner live modalities, CSO signatures, and MHRA/DTAC remain external."
};

console.log(JSON.stringify(snapshot, null, 2));
