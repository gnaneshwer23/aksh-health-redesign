/**
 * INT-04 — canonical medication-reconciliation write path.
 *
 * Patient 360 and medication-care both used to call `createMedRecon` independently,
 * producing duplicate pending runs against the same physical store
 * (`aksh.medication_reconciliation_runs`). This module is the single start/decide
 * entry: dedupe open runs, stamp `entrySurface`, keep ehrWrite/autonomousPrescribe false.
 * No Neon drops — additive `entry_surface` column is local-dev/simulation only (050).
 */

import { getPatientById } from "../mock-data";
import {
  createMedRecon,
  decideMedRecon,
  listMedRecons,
} from "./repository";
import type {
  MedicationListItem,
  MedicationReconciliationRun,
  MedReconDiscrepancy,
  MedReconEntrySurface,
} from "./types";

export const MED_RECON_PHYSICAL_STORE = "medication_reconciliation_runs" as const;

export type StartCanonicalMedReconResult = {
  run: MedicationReconciliationRun;
  created: boolean;
  reused: boolean;
  physicalStore: typeof MED_RECON_PHYSICAL_STORE;
  ehrWrite: false;
  autonomousPrescribe: false;
};

export type DecideCanonicalMedReconResult = {
  run: MedicationReconciliationRun;
  physicalStore: typeof MED_RECON_PHYSICAL_STORE;
  ehrWrite: false;
  autonomousPrescribe: false;
};

function medicationItemsFromCohort(patientId: string): MedicationListItem[] {
  const patient = getPatientById(patientId);
  return (patient?.activeMedications ?? []).map((name) => ({
    name,
    status: /proposed/i.test(name) ? ("proposed" as const) : ("active" as const),
    source: "mock_cohort",
  }));
}

function buildDiscrepancies(medications: MedicationListItem[]): MedReconDiscrepancy[] {
  const discrepancies: MedReconDiscrepancy[] = medications
    .filter((m) => m.status === "proposed")
    .map((m) => ({
      code: "proposed_medication",
      message: `${m.name} is proposed — clinician reconciliation required before any prescribe`,
      medication: m.name,
    }));
  if (medications.length === 0) {
    discrepancies.push({
      code: "empty_medication_list",
      message: "No medications on cohort record to reconcile",
    });
  } else if (discrepancies.length === 0) {
    discrepancies.push({
      code: "confirm_active_list",
      message: "Confirm active list with patient — scaffolding only; does not prescribe",
    });
  }
  return discrepancies;
}

function noteForSurface(surface: MedReconEntrySurface): string {
  if (surface === "patient360") {
    return "Canonical med-recon via patient-360 — scaffolding only; does not prescribe or write to EHR";
  }
  if (surface === "medcare") {
    return "Canonical med-recon via medication-care — scaffolding only; does not prescribe or write to EHR";
  }
  return "Canonical med-recon (shared) — scaffolding only; does not prescribe or write to EHR";
}

/** Open HITL runs that should not be duplicated across entry surfaces. */
export function isOpenMedReconStatus(status: MedicationReconciliationRun["status"]): boolean {
  return status === "pending_clinician" || status === "in_progress" || status === "draft";
}

export async function findOpenMedRecon(
  patientId: string,
  options?: { scopeKey?: string }
): Promise<MedicationReconciliationRun | null> {
  const runs = await listMedRecons(patientId, options);
  return runs.find((r) => isOpenMedReconStatus(r.status)) ?? null;
}

/**
 * Start (or reuse) a single open med-recon run for the patient.
 * Both Patient 360 and medication-care POST actions must call this.
 */
export async function startCanonicalMedReconciliation(
  patientId: string,
  options: {
    scopeKey?: string;
    createdBy: string;
    entrySurface: MedReconEntrySurface;
    /** When true, reuse any open run regardless of which surface created it. */
    reuseOpen?: boolean;
  }
): Promise<StartCanonicalMedReconResult> {
  const scopeKey = options.scopeKey ?? "shared";
  const reuseOpen = options.reuseOpen !== false;
  if (reuseOpen) {
    const open = await findOpenMedRecon(patientId, { scopeKey });
    if (open) {
      return {
        run: open,
        created: false,
        reused: true,
        physicalStore: MED_RECON_PHYSICAL_STORE,
        ehrWrite: false,
        autonomousPrescribe: false,
      };
    }
  }

  const medications = medicationItemsFromCohort(patientId);
  const run = await createMedRecon(
    {
      patientId,
      sourceList: medications,
      reconciledList: medications.filter((m) => m.status !== "proposed"),
      discrepancies: buildDiscrepancies(medications),
      createdBy: options.createdBy,
      note: noteForSurface(options.entrySurface),
      entrySurface: options.entrySurface,
    },
    { scopeKey }
  );

  return {
    run,
    created: true,
    reused: false,
    physicalStore: MED_RECON_PHYSICAL_STORE,
    ehrWrite: false,
    autonomousPrescribe: false,
  };
}

/** Decide a run via the single physical store — shared by both decision routes. */
export async function decideCanonicalMedReconciliation(
  input: {
    runId: string;
    action: "complete" | "cancel";
    actor: string;
    note?: string;
    reconciledList?: MedicationListItem[];
  },
  options?: { scopeKey?: string }
): Promise<DecideCanonicalMedReconResult> {
  const run = await decideMedRecon(input, options);
  return {
    run,
    physicalStore: MED_RECON_PHYSICAL_STORE,
    ehrWrite: false,
    autonomousPrescribe: false,
  };
}
