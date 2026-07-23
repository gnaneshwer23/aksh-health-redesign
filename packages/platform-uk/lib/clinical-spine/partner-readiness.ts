/**
 * Phase F — partner / regulatory readiness pack (in-repo).
 * Consolidates EMIS/SystmOne, DPIA, CSO Gate 2, G-ML-1…3, modality credentials.
 * Honesty: liveEmis always false · never invents signed DPIA / CSO / MHRA / DCB0129.
 */

import { getEmisIntegrationStatus } from "@/lib/emis-staging";
import { getEmisPartnerSandboxStatus } from "@/lib/emis-partner-sandbox";
import { getEmisPartnerChecklist } from "@/lib/precision-health/emis-partner-checklist";
import type { PartnerGateArtifact } from "@/lib/repositories/partner-gate-artifact-repository";

export const SPINE_PARTNER_HONESTY = {
  liveEmis: false as const,
  liveWriteBack: false as const,
  autoRetrain: false as const,
  physiologicalTwin: false as const,
  hitlRequired: true as const,
  ehrWrite: false as const,
  /** Platform never claims signed regulatory approvals from code alone */
  signedDpia: false as const,
  signedCsoGate2: false as const,
  signedDcb0129: false as const,
  signedMhra: false as const,
  namedCsoAssigned: false as const
};

export type PartnerTrackId =
  | "emis_systmone"
  | "dpia"
  | "cso_gate2"
  | "g_ml_gates"
  | "modality_credentials"
  | "regulatory_path";

export type PartnerTrackUiStatus =
  | "scaffold_ready"
  | "unsigned"
  | "pending"
  | "blocked"
  | "needs_partner"
  | "needs_cso";

export type PartnerTrack = {
  id: PartnerTrackId;
  label: string;
  uiStatus: PartnerTrackUiStatus;
  owner: string;
  inRepoEvidence: string[];
  externalAction: string;
  note: string;
};

export type LiveEmisFlipRequirement = {
  id: string;
  label: string;
  owner: string;
  metInCode: boolean;
  status: "scaffold_ready" | "needs_partner" | "needs_cso" | "blocked";
  note: string;
};

export type EvidencePackLink = {
  id: string;
  label: string;
  path: string;
  kind: "doc" | "api" | "script" | "gate";
  partnerReviewReady: boolean;
  note: string;
};

export type PartnerReadinessPack = {
  artifactType: "aksh-partner-readiness-pack";
  phase: "F";
  honesty: typeof SPINE_PARTNER_HONESTY;
  tracks: PartnerTrack[];
  liveEmisFlipChecklist: LiveEmisFlipRequirement[];
  evidencePackLinks: EvidencePackLink[];
  emis: ReturnType<typeof getEmisPartnerChecklist>;
  staging: ReturnType<typeof getEmisIntegrationStatus>;
  /** N5 — Partner sandbox flag / creds honesty (never liveEmis). */
  sandbox: ReturnType<typeof getEmisPartnerSandboxStatus>;
  gateArtifacts: {
    total: number;
    byStatus: Record<string, number>;
    latest: PartnerGateArtifact[];
    /** Never true from in-repo state alone */
    anyCertified: false;
  };
  notLiveBanner: string;
  note: string;
};

const NOT_LIVE_BANNER =
  "NOT LIVE EMIS — staging / sim write-back only. liveEmis:false until partner credentials + DPIA + CSO go/no-go are real and signed out-of-band.";

export function getLiveEmisFlipChecklist(): LiveEmisFlipRequirement[] {
  const sandbox = getEmisPartnerSandboxStatus();
  const credentialsPresent = sandbox.credentialsConfigured;

  return [
    {
      id: "hitl-accept-path",
      label: "HITL Accept → staging → sim write-back path green",
      owner: "Engineering",
      metInCode: true,
      status: "scaffold_ready",
      note: "ehr-writeback-sim + emis-staging + clinical-proof HITL chain."
    },
    {
      id: "partner-sandbox-flag",
      label: "ENABLE_EMIS_PARTNER_SANDBOX feature flag (sandbox only)",
      owner: "Engineering",
      metInCode: sandbox.sandboxFlagEnabled,
      status: sandbox.sandboxFlagEnabled ? "scaffold_ready" : "needs_partner",
      note: sandbox.sandboxFlagEnabled
        ? `Flag on · mode=${sandbox.mode} · writePath=${sandbox.writePath} — still liveEmis:false.`
        : "Flag off (default) = sim path. Set ENABLE_EMIS_PARTNER_SANDBOX=true only for Partner sandbox rehearsal."
    },
    {
      id: "partner-api-credentials",
      label: "EMIS / SystmOne Partner API credentials in secure env",
      owner: "Partner",
      metInCode: credentialsPresent,
      status: credentialsPresent ? "needs_cso" : "needs_partner",
      note: credentialsPresent
        ? "Env present — still needs CSO UAT + signed go/no-go before any live write."
        : "Partner must supply client id/secret/token URL/FHIR base — never invent."
    },
    {
      id: "fhir-write-scope",
      label: "FHIR R4 write scope agreed (Accept-only resources)",
      owner: "Partner + CSO",
      metInCode: false,
      status: "needs_partner",
      note: "Out-of-band scope doc — not inventable in code."
    },
    {
      id: "dpia-dpa",
      label: "DPIA + DPA covering EMR write-back",
      owner: "IG / DPO / Legal",
      metInCode: false,
      status: "needs_partner",
      note: "Human artefacts only — track via partner-gates as pending."
    },
    {
      id: "cso-go-nogo",
      label: "Signed write-back go / no-go (CSO + release authority)",
      owner: "CSO",
      metInCode: false,
      status: "blocked",
      note: "Until signed, platform stays staging-only. Code will not flip liveEmis."
    },
    {
      id: "uat-rollback",
      label: "Partner UAT + disable / rollback path rehearsed",
      owner: "Engineering + clinical lead",
      metInCode: false,
      status: "needs_partner",
      note: "UAT script + flag-off procedure — external rehearsal."
    }
  ];
}

export function getEvidencePackLinks(): EvidencePackLink[] {
  return [
    {
      id: "evidence-readme",
      label: "Evidence pack index (16 artefacts)",
      path: "docs/evidence-pack/README.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "Slots + regenerate via npm run evidence:pack"
    },
    {
      id: "safety-case-rehearsal",
      label: "Safety case rehearsal",
      path: "docs/SAFETY_CASE_REHEARSAL.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "Documentary — CSO still unassigned"
    },
    {
      id: "e2e-clinical-proof",
      label: "E2E clinical proof + honest gap register",
      path: "docs/E2E_CLINICAL_PROOF.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "Partner blockers listed honestly"
    },
    {
      id: "hazard-log",
      label: "Hazard log template",
      path: "docs/HAZARD_LOG_TEMPLATE.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "CSO approval columns Unsigned"
    },
    {
      id: "gate-1",
      label: "Gate 1 — platform readiness",
      path: "docs/evidence-pack/gate-1-platform-readiness.md",
      kind: "gate",
      partnerReviewReady: true,
      note: "Sign-off MANUAL"
    },
    {
      id: "gate-2",
      label: "Gate 2 — clinical safety",
      path: "docs/evidence-pack/gate-2-clinical-safety.md",
      kind: "gate",
      partnerReviewReady: true,
      note: "CSO Gate 2 — unsigned until human signs"
    },
    {
      id: "gate-3",
      label: "Gate 3 — pilot authority",
      path: "docs/evidence-pack/gate-3-pilot-authority.md",
      kind: "gate",
      partnerReviewReady: true,
      note: "Sponsor / authority MANUAL"
    },
    {
      id: "residual-risk",
      label: "Residual risk",
      path: "docs/evidence-pack/15-residual-risk.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "EMIS/SystmOne BLOCKED: partner"
    },
    {
      id: "phase2-checklist",
      label: "Phase 2 partner checklist (EMIS + wearable DPIA)",
      path: "docs/PHASE2_PARTNER_CHECKLIST.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "Primary partner track checklist"
    },
    {
      id: "p7-outreach-pack",
      label: "P7 partner outreach / paperwork pack",
      path: "docs/P7_PARTNER_OUTREACH_PACK.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "IM1 email + external action checklist — not live flip"
    },
    {
      id: "p7-audit",
      label: "P7 audit (paperwork PASS / live NO-GO)",
      path: "docs/PHASED_BUILD_P7_AUDIT.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "Honesty: liveEmis remains false"
    },
    {
      id: "phase3-regulatory",
      label: "Phase 3 regulatory path (unsigned templates)",
      path: "docs/PHASE3_REGULATORY_PATH.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "DTAC / DCB0129 / MHRA / DPIA templates — not certifications"
    },
    {
      id: "g-ml-sop",
      label: "Governed model release SOP (G-ML-1…3)",
      path: "docs/GOVERNED_MODEL_RELEASE_SOP.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "autoRetrain:false hard"
    },
    {
      id: "phase-f-doc",
      label: "Clinical spine Phase F",
      path: "docs/CLINICAL_SPINE_PHASE_F.md",
      kind: "doc",
      partnerReviewReady: true,
      note: "This phase — in-repo vs external"
    },
    {
      id: "evidence-pack-script",
      label: "Regenerate machine snapshots",
      path: "npm run evidence:pack",
      kind: "script",
      partnerReviewReady: true,
      note: "Never invents CSO signatures"
    },
    {
      id: "emis-checklist-api",
      label: "EMIS partner checklist API",
      path: "GET /api/integrations/emis-partner-checklist",
      kind: "api",
      partnerReviewReady: true,
      note: "liveEmis:false always"
    },
    {
      id: "emis-partner-sandbox-api",
      label: "EMIS Partner sandbox status (N5)",
      path: "GET /api/integrations/emis-partner-sandbox",
      kind: "api",
      partnerReviewReady: true,
      note: "Flag off=sim · flag on without creds=needs_partner · liveEmis:false"
    },
    {
      id: "partner-readiness-api",
      label: "Partner readiness API",
      path: "GET /api/clinical-spine/partner-readiness",
      kind: "api",
      partnerReviewReady: true,
      note: "Consolidated Phase F status"
    }
  ];
}

function deriveTrackStatus(
  artifacts: PartnerGateArtifact[],
  gateIds: string[],
  fallback: PartnerTrackUiStatus
): PartnerTrackUiStatus {
  const relevant = artifacts.filter((a) => gateIds.includes(a.gateId));
  if (relevant.some((a) => a.status === "blocked")) return "blocked";
  if (relevant.some((a) => a.status === "pending_review" || a.status === "external_ref_noted")) {
    return "pending";
  }
  if (relevant.some((a) => a.status === "unsigned")) return "unsigned";
  return fallback;
}

export function buildPartnerTracks(artifacts: PartnerGateArtifact[] = []): PartnerTrack[] {
  const sandbox = getEmisPartnerSandboxStatus();
  const credentialsPresent = sandbox.credentialsConfigured;
  const emisUiStatus: PartnerTrackUiStatus =
    sandbox.mode === "needs_partner"
      ? "needs_partner"
      : credentialsPresent
        ? "needs_cso"
        : "needs_partner";

  return [
    {
      id: "emis_systmone",
      label: "EMIS / SystmOne write-back",
      uiStatus: emisUiStatus,
      owner: "Partner + engineering",
      inRepoEvidence: [
        "lib/emis-partner-sandbox.ts",
        "lib/emis-staging.ts",
        "GET/POST /api/integrations/emis-partner-sandbox",
        "POST /api/integrations/emis-staging",
        "POST /api/integrations/ehr-writeback-sim",
        "docs/PHASE2_PARTNER_CHECKLIST.md §A"
      ],
      externalAction: "Supply Partner API credentials, FHIR write scope, UAT, signed go/no-go",
      note: `N5 sandbox: mode=${sandbox.mode} · writePath=${sandbox.writePath} · flag=${sandbox.sandboxFlagEnabled}. Staging/sim default — never live EMIS. SystmOne shares this partner track.`
    },
    {
      id: "dpia",
      label: "DPIA (EMR write-back + first modality)",
      uiStatus: deriveTrackStatus(artifacts, ["DPIA_EMR", "DPIA_MODALITY"], "unsigned"),
      owner: "IG / DPO",
      inRepoEvidence: [
        "docs/PHASE2_PARTNER_CHECKLIST.md §B",
        "docs/PHASE3_REGULATORY_PATH.md §4",
        "GET/POST /api/clinical-spine/partner-gates"
      ],
      externalAction: "Complete and sign DPIA; record reference ID as pending human artefact",
      note: "Code cannot invent a signed DPIA. Track status stays unsigned/pending until humans note an external ref."
    },
    {
      id: "cso_gate2",
      label: "CSO Gate 2 (clinical safety)",
      uiStatus: deriveTrackStatus(artifacts, ["CSO_GATE2", "NAMED_CSO"], "unsigned"),
      owner: "CSO (unassigned)",
      inRepoEvidence: [
        "docs/evidence-pack/gate-2-clinical-safety.md",
        "docs/SAFETY_CASE_REHEARSAL.md",
        "docs/HAZARD_LOG_TEMPLATE.md"
      ],
      externalAction: "Assign named CSO; sign Gate 2 + hazard residual risk",
      note: "G-ML-2 UI checkboxes are rehearsal only — not production CSO certification."
    },
    {
      id: "g_ml_gates",
      label: "G-ML-1…3 governed evaluation",
      uiStatus: "scaffold_ready",
      owner: "Engineering + CSO + release authority",
      inRepoEvidence: [
        "docs/GOVERNED_MODEL_RELEASE_SOP.md",
        "GET/POST /api/clinical-spine/governed-evaluation",
        "GovernedEvaluationPanel"
      ],
      externalAction: "Named signers for production G-ML-2 / G-ML-3 (G-ML-1 eng harness in-repo)",
      note: "propose_model_update blocked without gates; autoRetrain:false always."
    },
    {
      id: "modality_credentials",
      label: "First live modality credentials",
      uiStatus: process.env.FITBIT_CLIENT_ID?.trim() ? "needs_cso" : "needs_partner",
      owner: "Partner + IG",
      inRepoEvidence: [
        "lib/precision-health/connectors.ts",
        "docs/PHASE2_PARTNER_CHECKLIST.md §B",
        "GET /api/precision-health/connectors"
      ],
      externalAction: "Choose one modality; DPIA; vendor DPA; Fitbit/OpenWeather keys only when real",
      note: "Connectors stay liveStream:false without real credentials + consent."
    },
    {
      id: "regulatory_path",
      label: "DTAC / DCB0129 / MHRA path",
      uiStatus: deriveTrackStatus(
        artifacts,
        ["DTAC", "DCB0129", "MHRA_ROUTE"],
        "unsigned"
      ),
      owner: "CSO + regulatory consultant",
      inRepoEvidence: ["docs/PHASE3_REGULATORY_PATH.md", "docs/evidence-pack/"],
      externalAction: "Fund consultant; select route; submit — never claim approval from scaffold",
      note: "Templates only. signedDcb0129 / signedMhra remain false in honesty pack."
    }
  ];
}

export function buildPartnerReadinessPack(input?: {
  artifacts?: PartnerGateArtifact[];
}): PartnerReadinessPack {
  const artifacts = input?.artifacts ?? [];
  const byStatus: Record<string, number> = {};
  for (const a of artifacts) {
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  }

  const sandbox = getEmisPartnerSandboxStatus();

  return {
    artifactType: "aksh-partner-readiness-pack",
    phase: "F",
    honesty: { ...SPINE_PARTNER_HONESTY },
    tracks: buildPartnerTracks(artifacts),
    liveEmisFlipChecklist: getLiveEmisFlipChecklist(),
    evidencePackLinks: getEvidencePackLinks(),
    emis: getEmisPartnerChecklist(),
    staging: getEmisIntegrationStatus(),
    sandbox,
    gateArtifacts: {
      total: artifacts.length,
      byStatus,
      latest: artifacts.slice(0, 20),
      anyCertified: false
    },
    notLiveBanner: NOT_LIVE_BANNER,
    note: `Phase F + N5 sandbox honesty (mode=${sandbox.mode}, writePath=${sandbox.writePath}). External: credentials, signed DPIA/CSO/DTAC/DCB0129/MHRA, live write-back. liveEmis never flips from this pack alone.`
  };
}

/** True only if every flip requirement is metInCode — today always false (blocked go/no-go). */
export function canFlipLiveEmisInCode(): false {
  return false;
}
