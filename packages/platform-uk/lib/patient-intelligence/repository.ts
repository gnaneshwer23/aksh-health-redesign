import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { getPgPool, isPostgresConfigured } from "../db/client";
import type {
  AllergyRecord,
  CareAssignment,
  ConditionRecord,
  DiabetesProfile,
  DiabetesType,
  EncounterRecord,
  FamilyHistoryRecord,
  MedicationListItem,
  MedicationReconciliationRun,
  MedReconDiscrepancy,
  ObservationItem,
  Provenance,
  QualityFlag,
  SharingPreference,
} from "./types";

type Store = {
  conditions: ConditionRecord[];
  allergies: AllergyRecord[];
  familyHistory: FamilyHistoryRecord[];
  diabetesProfiles: DiabetesProfile[];
  encounters: EncounterRecord[];
  observations: ObservationItem[];
  medRecons: MedicationReconciliationRun[];
  careAssignments: CareAssignment[];
  sharingPreferences: SharingPreference[];
};

const dataDir = path.join(process.cwd(), "data");

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  return path.join(
    dataDir,
    safe === "shared" ? "patient-intelligence.json" : `patient-intelligence.${safe}.json`
  );
}

async function readStore(scopeKey: string): Promise<Store> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      conditions: Array.isArray(parsed.conditions) ? parsed.conditions : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      familyHistory: Array.isArray(parsed.familyHistory) ? parsed.familyHistory : [],
      diabetesProfiles: Array.isArray(parsed.diabetesProfiles) ? parsed.diabetesProfiles : [],
      encounters: Array.isArray(parsed.encounters) ? parsed.encounters : [],
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      medRecons: Array.isArray(parsed.medRecons) ? parsed.medRecons : [],
      careAssignments: Array.isArray(parsed.careAssignments) ? parsed.careAssignments : [],
      sharingPreferences: Array.isArray(parsed.sharingPreferences) ? parsed.sharingPreferences : [],
    };
  } catch {
    return {
      conditions: [],
      allergies: [],
      familyHistory: [],
      diabetesProfiles: [],
      encounters: [],
      observations: [],
      medRecons: [],
      careAssignments: [],
      sharingPreferences: [],
    };
  }
}

async function writeStore(store: Store, scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify(store, null, 2), "utf8");
}

function usePg(): boolean {
  return isPostgresConfigured();
}

function nowIso() {
  return new Date().toISOString();
}

function prov(
  sourceSystem: string,
  confidence = 1,
  sourceReference?: string,
  recordedAt?: string
): Provenance {
  return {
    sourceSystem,
    sourceReference,
    confidence,
    recordedAt: recordedAt ?? nowIso(),
  };
}

export async function replacePatientSpine(
  patientId: string,
  payload: {
    conditions: Omit<ConditionRecord, "synthetic">[];
    allergies: Omit<AllergyRecord, "synthetic">[];
    familyHistory: Omit<FamilyHistoryRecord, "synthetic">[];
    diabetes: Omit<DiabetesProfile, "synthetic"> | null;
    encounters: Omit<EncounterRecord, "synthetic">[];
    observations: Omit<ObservationItem, "synthetic">[];
    careAssignments: Omit<CareAssignment, "synthetic">[];
    sharingPreferences: Omit<SharingPreference, "synthetic">[];
  },
  options?: { scopeKey?: string }
): Promise<void> {
  const scopeKey = options?.scopeKey ?? "shared";

  if (usePg()) {
    const pool = getPgPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM aksh.patient_conditions WHERE scope_key=$1 AND patient_id=$2`, [
        scopeKey,
        patientId,
      ]);
      await client.query(`DELETE FROM aksh.patient_allergies WHERE scope_key=$1 AND patient_id=$2`, [
        scopeKey,
        patientId,
      ]);
      await client.query(
        `DELETE FROM aksh.patient_family_history WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(
        `DELETE FROM aksh.patient_diabetes_profiles WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(`DELETE FROM aksh.patient_encounters WHERE scope_key=$1 AND patient_id=$2`, [
        scopeKey,
        patientId,
      ]);
      await client.query(
        `DELETE FROM aksh.patient_observation_items WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      await client.query(
        `DELETE FROM aksh.patient_care_assignments WHERE scope_key=$1 AND patient_id=$2`,
        [scopeKey, patientId]
      );
      // sharing preferences are append-only — do not delete; seed inserts fresh rows

      for (const c of payload.conditions) {
        await client.query(
          `INSERT INTO aksh.patient_conditions
            (id, scope_key, patient_id, display, code, code_system, clinical_status, category,
             onset_date, recorded_at, source_system, source_reference, confidence, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
          [
            c.id,
            scopeKey,
            patientId,
            c.display,
            c.code,
            c.codeSystem,
            c.clinicalStatus,
            c.category,
            c.onsetDate,
            c.provenance.recordedAt,
            c.provenance.sourceSystem,
            c.provenance.sourceReference ?? null,
            c.provenance.confidence,
          ]
        );
      }
      for (const a of payload.allergies) {
        await client.query(
          `INSERT INTO aksh.patient_allergies
            (id, scope_key, patient_id, substance, code, code_system, criticality, reaction,
             clinical_status, recorded_at, source_system, source_reference, confidence, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
          [
            a.id,
            scopeKey,
            patientId,
            a.substance,
            a.code,
            a.codeSystem,
            a.criticality,
            a.reaction,
            a.clinicalStatus,
            a.provenance.recordedAt,
            a.provenance.sourceSystem,
            a.provenance.sourceReference ?? null,
            a.provenance.confidence,
          ]
        );
      }
      for (const f of payload.familyHistory) {
        await client.query(
          `INSERT INTO aksh.patient_family_history
            (id, scope_key, patient_id, relationship, condition_display, condition_code, code_system,
             onset_age_years, notes, recorded_at, source_system, confidence, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`,
          [
            f.id,
            scopeKey,
            patientId,
            f.relationship,
            f.conditionDisplay,
            f.conditionCode,
            f.codeSystem,
            f.onsetAgeYears,
            f.notes,
            f.provenance.recordedAt,
            f.provenance.sourceSystem,
            f.provenance.confidence,
          ]
        );
      }
      if (payload.diabetes) {
        const d = payload.diabetes;
        await client.query(
          `INSERT INTO aksh.patient_diabetes_profiles
            (id, scope_key, patient_id, diabetes_type, classification_note, diagnosed_on, snomed_code,
             status, recorded_at, source_system, confidence, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
          [
            d.id,
            scopeKey,
            patientId,
            d.diabetesType,
            d.classificationNote,
            d.diagnosedOn,
            d.snomedCode,
            d.status,
            d.provenance.recordedAt,
            d.provenance.sourceSystem,
            d.provenance.confidence,
          ]
        );
      }
      for (const e of payload.encounters) {
        await client.query(
          `INSERT INTO aksh.patient_encounters
            (id, scope_key, patient_id, class_name, reason, clinician_summary, status,
             started_at, ended_at, recorded_at, source_system, source_reference, confidence, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
          [
            e.id,
            scopeKey,
            patientId,
            e.className,
            e.reason,
            e.clinicianSummary,
            e.status,
            e.startedAt,
            e.endedAt,
            e.provenance.recordedAt,
            e.provenance.sourceSystem,
            e.provenance.sourceReference ?? null,
            e.provenance.confidence,
          ]
        );
      }
      for (const o of payload.observations) {
        await client.query(
          `INSERT INTO aksh.patient_observation_items
            (id, scope_key, patient_id, kind, display, value_numeric, value_text, unit, code, code_system,
             observed_at, source_system, source_channel, verified, quality_flag, confidence, recorded_at, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true)`,
          [
            o.id,
            scopeKey,
            patientId,
            o.kind,
            o.display,
            o.valueNumeric,
            o.valueText,
            o.unit,
            o.code,
            o.codeSystem,
            o.observedAt,
            o.provenance.sourceSystem,
            o.sourceChannel,
            o.verified,
            o.qualityFlag,
            o.provenance.confidence,
            o.provenance.recordedAt,
          ]
        );
      }
      for (const c of payload.careAssignments) {
        await client.query(
          `INSERT INTO aksh.patient_care_assignments
            (id, scope_key, patient_id, member_display, care_role, member_email, status,
             assigned_at, ended_at, source_system, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'synthetic_seed',true)`,
          [
            c.id,
            scopeKey,
            patientId,
            c.memberDisplay,
            c.careRole,
            c.memberEmail,
            c.status,
            c.assignedAt,
            c.endedAt,
          ]
        );
      }
      for (const s of payload.sharingPreferences) {
        await client.query(
          `INSERT INTO aksh.patient_sharing_preferences
            (id, scope_key, patient_id, purpose, status, basis, recorded_by, recorded_at, synthetic)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
          [
            s.id,
            scopeKey,
            patientId,
            s.purpose,
            s.status,
            s.basis,
            s.recordedBy,
            s.recordedAt,
          ]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
    return;
  }

  const store = await readStore(scopeKey);
  store.conditions = [
    ...store.conditions.filter((c) => c.patientId !== patientId),
    ...payload.conditions.map((c) => ({ ...c, synthetic: true as const })),
  ];
  store.allergies = [
    ...store.allergies.filter((a) => a.patientId !== patientId),
    ...payload.allergies.map((a) => ({ ...a, synthetic: true as const })),
  ];
  store.familyHistory = [
    ...store.familyHistory.filter((f) => f.patientId !== patientId),
    ...payload.familyHistory.map((f) => ({ ...f, synthetic: true as const })),
  ];
  store.diabetesProfiles = [
    ...store.diabetesProfiles.filter((d) => d.patientId !== patientId),
    ...(payload.diabetes ? [{ ...payload.diabetes, synthetic: true as const }] : []),
  ];
  store.encounters = [
    ...store.encounters.filter((e) => e.patientId !== patientId),
    ...payload.encounters.map((e) => ({ ...e, synthetic: true as const })),
  ];
  store.observations = [
    ...store.observations.filter((o) => o.patientId !== patientId),
    ...payload.observations.map((o) => ({ ...o, synthetic: true as const })),
  ];
  store.careAssignments = [
    ...store.careAssignments.filter((c) => c.patientId !== patientId),
    ...payload.careAssignments.map((c) => ({ ...c, synthetic: true as const })),
  ];
  store.sharingPreferences = [
    ...store.sharingPreferences,
    ...payload.sharingPreferences.map((s) => ({ ...s, synthetic: true as const })),
  ];
  await writeStore(store, scopeKey);
}

export async function listConditions(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_conditions WHERE scope_key=$1 AND patient_id=$2 ORDER BY recorded_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapConditionRow);
  }
  return (await readStore(scopeKey)).conditions.filter((c) => c.patientId === patientId);
}

export async function listAllergies(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_allergies WHERE scope_key=$1 AND patient_id=$2 ORDER BY recorded_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapAllergyRow);
  }
  return (await readStore(scopeKey)).allergies.filter((a) => a.patientId === patientId);
}

export async function listFamilyHistory(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_family_history WHERE scope_key=$1 AND patient_id=$2 ORDER BY recorded_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapFamilyRow);
  }
  return (await readStore(scopeKey)).familyHistory.filter((f) => f.patientId === patientId);
}

export async function getDiabetesProfile(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_diabetes_profiles WHERE scope_key=$1 AND patient_id=$2 LIMIT 1`,
      [scopeKey, patientId]
    );
    return rows[0] ? mapDiabetesRow(rows[0]) : null;
  }
  return (
    (await readStore(scopeKey)).diabetesProfiles.find((d) => d.patientId === patientId) ?? null
  );
}

export async function listEncounters(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_encounters WHERE scope_key=$1 AND patient_id=$2 ORDER BY started_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapEncounterRow);
  }
  return (await readStore(scopeKey)).encounters.filter((e) => e.patientId === patientId);
}

export async function listObservations(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_observation_items WHERE scope_key=$1 AND patient_id=$2 ORDER BY observed_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapObservationRow);
  }
  return (await readStore(scopeKey)).observations.filter((o) => o.patientId === patientId);
}

export async function listCareAssignments(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.patient_care_assignments WHERE scope_key=$1 AND patient_id=$2 ORDER BY assigned_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapCareRow);
  }
  return (await readStore(scopeKey)).careAssignments.filter((c) => c.patientId === patientId);
}

export async function listSharingPreferences(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (purpose) *
         FROM aksh.patient_sharing_preferences
        WHERE scope_key=$1 AND patient_id=$2
        ORDER BY purpose, recorded_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapSharingRow);
  }
  const all = (await readStore(scopeKey)).sharingPreferences.filter(
    (s) => s.patientId === patientId
  );
  const latest = new Map<string, SharingPreference>();
  for (const s of all.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) {
    latest.set(s.purpose, s);
  }
  return [...latest.values()];
}

export async function listMedRecons(patientId: string, options?: { scopeKey?: string }) {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medication_reconciliation_runs WHERE scope_key=$1 AND patient_id=$2 ORDER BY created_at DESC`,
      [scopeKey, patientId]
    );
    return rows.map(mapMedReconRow);
  }
  return (await readStore(scopeKey)).medRecons.filter((m) => m.patientId === patientId);
}

export async function createMedRecon(
  input: {
    patientId: string;
    sourceList: MedicationListItem[];
    reconciledList?: MedicationListItem[];
    discrepancies?: MedReconDiscrepancy[];
    createdBy: string;
    note?: string;
  },
  options?: { scopeKey?: string }
): Promise<MedicationReconciliationRun> {
  const scopeKey = options?.scopeKey ?? "shared";
  const row: MedicationReconciliationRun = {
    id: `mrecon-${randomUUID()}`,
    patientId: input.patientId,
    status: "pending_clinician",
    sourceList: input.sourceList,
    reconciledList: input.reconciledList ?? input.sourceList,
    discrepancies: input.discrepancies ?? [],
    createdBy: input.createdBy,
    createdAt: nowIso(),
    decidedBy: null,
    decidedAt: null,
    note: input.note ?? null,
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    synthetic: true,
  };

  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.medication_reconciliation_runs
        (id, scope_key, patient_id, status, source_list, reconciled_list, discrepancies,
         created_by, created_at, note, hitl_required, ehr_write, autonomous_prescribe, synthetic)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8,$9,$10,true,false,false,true)`,
      [
        row.id,
        scopeKey,
        row.patientId,
        row.status,
        JSON.stringify(row.sourceList),
        JSON.stringify(row.reconciledList),
        JSON.stringify(row.discrepancies),
        row.createdBy,
        row.createdAt,
        row.note,
      ]
    );
    return row;
  }

  const store = await readStore(scopeKey);
  store.medRecons.push(row);
  await writeStore(store, scopeKey);
  return row;
}

export async function decideMedRecon(
  input: {
    runId: string;
    action: "complete" | "cancel";
    actor: string;
    note?: string;
    reconciledList?: MedicationListItem[];
  },
  options?: { scopeKey?: string }
): Promise<MedicationReconciliationRun> {
  const scopeKey = options?.scopeKey ?? "shared";
  if (usePg()) {
    const pool = getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM aksh.medication_reconciliation_runs WHERE id=$1 AND scope_key=$2`,
      [input.runId, scopeKey]
    );
    if (!rows[0]) throw new Error("Medication reconciliation run not found");
    const current = mapMedReconRow(rows[0]);
    if (current.status === "completed" || current.status === "cancelled") {
      throw new Error(`Run already ${current.status}`);
    }
    const status = input.action === "complete" ? "completed" : "cancelled";
    const reconciled = input.reconciledList ?? current.reconciledList;
    await pool.query(
      `UPDATE aksh.medication_reconciliation_runs
          SET status=$1, decided_by=$2, decided_at=$3, note=COALESCE($4, note),
              reconciled_list=$5::jsonb
        WHERE id=$6 AND scope_key=$7`,
      [
        status,
        input.actor,
        nowIso(),
        input.note ?? null,
        JSON.stringify(reconciled),
        input.runId,
        scopeKey,
      ]
    );
    return {
      ...current,
      status,
      decidedBy: input.actor,
      decidedAt: nowIso(),
      note: input.note ?? current.note,
      reconciledList: reconciled,
    };
  }

  const store = await readStore(scopeKey);
  const idx = store.medRecons.findIndex((m) => m.id === input.runId);
  if (idx < 0) throw new Error("Medication reconciliation run not found");
  const current = store.medRecons[idx];
  if (current.status === "completed" || current.status === "cancelled") {
    throw new Error(`Run already ${current.status}`);
  }
  const updated: MedicationReconciliationRun = {
    ...current,
    status: input.action === "complete" ? "completed" : "cancelled",
    decidedBy: input.actor,
    decidedAt: nowIso(),
    note: input.note ?? current.note,
    reconciledList: input.reconciledList ?? current.reconciledList,
    ehrWrite: false,
    autonomousPrescribe: false,
    hitlRequired: true,
    synthetic: true,
  };
  store.medRecons[idx] = updated;
  await writeStore(store, scopeKey);
  return updated;
}

export async function appendSharingPreference(
  input: Omit<SharingPreference, "synthetic">,
  options?: { scopeKey?: string }
): Promise<SharingPreference> {
  const scopeKey = options?.scopeKey ?? "shared";
  const row: SharingPreference = { ...input, synthetic: true };
  if (usePg()) {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO aksh.patient_sharing_preferences
        (id, scope_key, patient_id, purpose, status, basis, recorded_by, recorded_at, synthetic)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
      [
        row.id,
        scopeKey,
        row.patientId,
        row.purpose,
        row.status,
        row.basis,
        row.recordedBy,
        row.recordedAt,
      ]
    );
    return row;
  }
  const store = await readStore(scopeKey);
  store.sharingPreferences.push(row);
  await writeStore(store, scopeKey);
  return row;
}

export { prov, randomUUID };

/* ---------- row mappers ---------- */

function mapConditionRow(r: Record<string, unknown>): ConditionRecord {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    display: String(r.display),
    code: r.code == null ? null : String(r.code),
    codeSystem: r.code_system == null ? null : String(r.code_system),
    clinicalStatus: r.clinical_status as ConditionRecord["clinicalStatus"],
    category: r.category as ConditionRecord["category"],
    onsetDate: r.onset_date == null ? null : String(r.onset_date).slice(0, 10),
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      r.source_reference == null ? undefined : String(r.source_reference),
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapAllergyRow(r: Record<string, unknown>): AllergyRecord {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    substance: String(r.substance),
    code: r.code == null ? null : String(r.code),
    codeSystem: r.code_system == null ? null : String(r.code_system),
    criticality: r.criticality as AllergyRecord["criticality"],
    reaction: r.reaction == null ? null : String(r.reaction),
    clinicalStatus: r.clinical_status as AllergyRecord["clinicalStatus"],
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      r.source_reference == null ? undefined : String(r.source_reference),
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapFamilyRow(r: Record<string, unknown>): FamilyHistoryRecord {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    relationship: String(r.relationship),
    conditionDisplay: String(r.condition_display),
    conditionCode: r.condition_code == null ? null : String(r.condition_code),
    codeSystem: r.code_system == null ? null : String(r.code_system),
    onsetAgeYears: r.onset_age_years == null ? null : Number(r.onset_age_years),
    notes: r.notes == null ? null : String(r.notes),
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      undefined,
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapDiabetesRow(r: Record<string, unknown>): DiabetesProfile {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    diabetesType: r.diabetes_type as DiabetesType,
    classificationNote: r.classification_note == null ? null : String(r.classification_note),
    diagnosedOn: r.diagnosed_on == null ? null : String(r.diagnosed_on).slice(0, 10),
    snomedCode: r.snomed_code == null ? null : String(r.snomed_code),
    status: r.status as DiabetesProfile["status"],
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      undefined,
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapEncounterRow(r: Record<string, unknown>): EncounterRecord {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    className: String(r.class_name),
    reason: r.reason == null ? null : String(r.reason),
    clinicianSummary: r.clinician_summary == null ? null : String(r.clinician_summary),
    status: r.status as EncounterRecord["status"],
    startedAt: new Date(String(r.started_at)).toISOString(),
    endedAt: r.ended_at == null ? null : new Date(String(r.ended_at)).toISOString(),
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      r.source_reference == null ? undefined : String(r.source_reference),
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapObservationRow(r: Record<string, unknown>): ObservationItem {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    kind: String(r.kind),
    display: String(r.display),
    valueNumeric: r.value_numeric == null ? null : Number(r.value_numeric),
    valueText: r.value_text == null ? null : String(r.value_text),
    unit: r.unit == null ? null : String(r.unit),
    code: r.code == null ? null : String(r.code),
    codeSystem: r.code_system == null ? null : String(r.code_system),
    observedAt: new Date(String(r.observed_at)).toISOString(),
    sourceChannel: r.source_channel == null ? null : String(r.source_channel),
    verified: Boolean(r.verified),
    qualityFlag: (r.quality_flag as QualityFlag) ?? "unassessed",
    provenance: prov(
      String(r.source_system),
      Number(r.confidence ?? 1),
      undefined,
      new Date(String(r.recorded_at)).toISOString()
    ),
    synthetic: true,
  };
}

function mapCareRow(r: Record<string, unknown>): CareAssignment {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    memberDisplay: String(r.member_display),
    careRole: String(r.care_role),
    memberEmail: r.member_email == null ? null : String(r.member_email),
    status: r.status as CareAssignment["status"],
    assignedAt: new Date(String(r.assigned_at)).toISOString(),
    endedAt: r.ended_at == null ? null : new Date(String(r.ended_at)).toISOString(),
    synthetic: true,
  };
}

function mapSharingRow(r: Record<string, unknown>): SharingPreference {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    purpose: r.purpose as SharingPreference["purpose"],
    status: r.status as SharingPreference["status"],
    basis: r.basis == null ? null : String(r.basis),
    recordedBy: r.recorded_by == null ? null : String(r.recorded_by),
    recordedAt: new Date(String(r.recorded_at)).toISOString(),
    synthetic: true,
  };
}

function mapMedReconRow(r: Record<string, unknown>): MedicationReconciliationRun {
  return {
    id: String(r.id),
    patientId: String(r.patient_id),
    status: r.status as MedicationReconciliationRun["status"],
    sourceList: (r.source_list as MedicationListItem[]) ?? [],
    reconciledList: (r.reconciled_list as MedicationListItem[]) ?? [],
    discrepancies: (r.discrepancies as MedReconDiscrepancy[]) ?? [],
    createdBy: String(r.created_by),
    createdAt: new Date(String(r.created_at)).toISOString(),
    decidedBy: r.decided_by == null ? null : String(r.decided_by),
    decidedAt: r.decided_at == null ? null : new Date(String(r.decided_at)).toISOString(),
    note: r.note == null ? null : String(r.note),
    hitlRequired: true,
    ehrWrite: false,
    autonomousPrescribe: false,
    synthetic: true,
  };
}
