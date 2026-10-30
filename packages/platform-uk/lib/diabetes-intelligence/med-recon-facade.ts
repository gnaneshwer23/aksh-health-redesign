/**
 * INT-04 — unified medication-reconciliation read model over dual entry points.
 *
 * Patient 360 and medication-care both start/decide recon against the same
 * physical store (`aksh.medication_reconciliation_runs`). This facade projects
 * runs with entry-surface provenance (`patient360` | `medcare` | `shared`) so
 * the connected pipeline and UI see one list. Write consolidation lives in
 * `patient-intelligence/med-recon-canonical`. No destructive Neon merge.
 */

import { getPatientById } from "../mock-data";
import { listMedRecons } from "../patient-intelligence/repository";
import type {
  MedicationReconciliationRun,
  MedReconEntrySurface,
} from "../patient-intelligence/types";
import { inferMedReconEntrySurface } from "../patient-intelligence/types";

export type UnifiedMedReconSourceStore = "medication_reconciliation_runs";

export type UnifiedMedRecon = {
  id: string;
  patientId: string;
  patientLabel: string;
  sourceStore: UnifiedMedReconSourceStore;
  /** Stable composite key — entry surface + id. */
  unifiedKey: string;
  entrySurface: MedReconEntrySurface;
  status: MedicationReconciliationRun["status"];
  discrepancyCount: number;
  medicationCount: number;
  createdBy: string;
  createdAt: string;
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
  hitlRequired: true;
  ehrWrite: false;
  autonomousPrescribe: false;
  synthetic: true;
  provenance: "patient360_entry" | "medcare_entry" | "shared_canonical";
};

function labelFor(patientId: string): string {
  return getPatientById(patientId)?.name?.trim() || patientId;
}

function provenanceFor(
  surface: MedReconEntrySurface
): UnifiedMedRecon["provenance"] {
  if (surface === "patient360") return "patient360_entry";
  if (surface === "medcare") return "medcare_entry";
  return "shared_canonical";
}

export function toUnifiedMedRecon(run: MedicationReconciliationRun): UnifiedMedRecon {
  const entrySurface = run.entrySurface ?? inferMedReconEntrySurface(run.note);
  return {
    id: run.id,
    patientId: run.patientId,
    patientLabel: labelFor(run.patientId),
    sourceStore: "medication_reconciliation_runs",
    unifiedKey: `medrecon:${entrySurface}:${run.id}`,
    entrySurface,
    status: run.status,
    discrepancyCount: run.discrepancies?.length ?? 0,
    medicationCount: run.sourceList?.length ?? 0,
    createdBy: run.createdBy,
    createdAt: run.createdAt,
    decidedBy: run.decidedBy,
    decidedAt: run.decidedAt,
    note: run.note,
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    synthetic: true,
    provenance: provenanceFor(entrySurface),
  };
}

export async function listUnifiedMedRecons(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<UnifiedMedRecon[]> {
  const runs = await listMedRecons(patientId, options);
  return runs.map(toUnifiedMedRecon).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function selectOpenMedRecons(runs: UnifiedMedRecon[]): UnifiedMedRecon[] {
  return runs.filter(
    (r) =>
      r.status === "pending_clinician" ||
      r.status === "in_progress" ||
      r.status === "draft"
  );
}

export function selectPatient360MedRecons(runs: UnifiedMedRecon[]): UnifiedMedRecon[] {
  return runs.filter((r) => r.entrySurface === "patient360");
}

export function selectMedCareMedRecons(runs: UnifiedMedRecon[]): UnifiedMedRecon[] {
  return runs.filter((r) => r.entrySurface === "medcare");
}
