/**
 * One patient spine (platform map G1/G2): lets the clinical-proof agents (CONDUCTOR and the agents it runs) work on a
 * care-network patient instead of only the P001–P100 demo cohort, and feeds that patient's trusted CGM and HbA1c into
 * Aksh Diabetes.
 *
 * Track B gate: never in the real workspace (production). There, patient data never reaches the AI agents until a
 * governed go-live opens Track B for that organisation. In simulation and rehearsal the care network holds synthetic
 * patients only.
 *
 * Reads run in the caller's tenant session, so row-level security decides which patient can be loaded. Only facts the
 * clinic counts are used: verified patient-reported readings, clinic and device observations, trusted CGM.
 */
import { CLINICIAN_ROLES, isRealWorkspace, TRACK_B_NOT_OPEN } from "../env/workspace";
import { registerSpinePatient } from "../mock-data/patients";
import type { Patient } from "../mock-data/types";
import type { CareNetworkDiabetesReadings } from "../disease-modules/diabetes/ingest";
import { LAB_KINDS, type LabKind } from "../labs/catalog";
import type { LabSnapshot } from "../labs/snapshot";
import { withTenant, type NetworkContext } from "../network/db";
import { NetworkError } from "../network/service";

const MG_PER_MMOL = 18.0182;
/** HbA1c IFCC (mmol/mol) → DCCT (%), the unit the diabetes module's HbA1c signal uses. */
export const hba1cPercent = (mmolMol: number) => Math.round((mmolMol / 10.929 + 2.15) * 10) / 10;
// Corrected lab results (041) keep the original row; a row that has been replaced no longer counts.
const TRUSTED = `x.status = 'final' AND (x.source NOT IN ('patient_reported', 'device') OR x.verified) AND NOT EXISTS (SELECT 1 FROM aksh.network_observations c WHERE c.replaces_id = x.id)`;


export class TrackBClosedError extends NetworkError {
  constructor() {
    super(TRACK_B_NOT_OPEN, 403);
  }
}

export type SpinePatient = { patient: Patient; careNetwork: CareNetworkDiabetesReadings; provenance: { patientSource: "care_network"; glucoseSource: "care_network_cgm" | "none"; cgmReadings: number; hba1cReadings: number; labResults: number } };

/** Laboratory kinds the agents read as a snapshot (HbA1c has its own series; laboratory glucose is not used yet). */
const SNAPSHOT_KINDS = LAB_KINDS.filter((k) => k !== "hba1c" && k !== "glucose");

export async function loadSpinePatient(ctx: NetworkContext, patientId: string, now = new Date()): Promise<SpinePatient> {
  if (isRealWorkspace()) throw new TrackBClosedError();
  if (!CLINICIAN_ROLES.has(ctx.role ?? "")) throw new NetworkError("Only clinicians run a clinical review", 403);
  return withTenant(ctx, async (client) => {
    const p = (await client.query<{ id: string; record_ref: string | null; given_name: string; family_name: string; dob: string; sex: string | null; diabetes_type: string | null; conditions: string[]; organisation: string | null; next_appointment: Date | null }>(
      `SELECT p.id, p.record_ref, p.given_name, p.family_name, to_char(p.date_of_birth, 'YYYY-MM-DD') AS dob, p.sex, p.diabetes_type, p.conditions,
              (SELECT o.name FROM aksh.organisations o WHERE o.id = p.organisation_id) AS organisation, p.next_appointment
       FROM aksh.network_patients p WHERE p.id = $1`,
      [patientId]
    )).rows[0];
    if (!p) throw new NetworkError("Patient not found", 404);
    const meds = (await client.query<{ name: string; dose: string | null }>(
      `SELECT name, dose FROM aksh.network_medications WHERE patient_id = $1 AND (ended_on IS NULL OR ended_on > CURRENT_DATE) ORDER BY name`,
      [patientId]
    )).rows;
    const obs = (await client.query<{ kind: string; value: number; observed_at: Date }>(
      `SELECT x.kind, x.value::float AS value, x.observed_at FROM aksh.network_observations x
       WHERE x.patient_id = $1 AND x.kind IN ('hba1c', 'systolic_bp', 'diastolic_bp') AND ${TRUSTED} ORDER BY x.observed_at`,
      [patientId]
    )).rows;
    // Latest trusted result of each laboratory kind, with its provenance (lib/labs/snapshot.ts).
    const labRows = (await client.query<{ kind: LabKind; value: number; unit: string; observed_at: Date; channel: string | null; code: string | null; corrected: boolean }>(
      `SELECT DISTINCT ON (x.kind) x.kind, x.value::float AS value, x.unit, x.observed_at, x.channel, x.code, (x.replaces_id IS NOT NULL) AS corrected
         FROM aksh.network_observations x
        WHERE x.patient_id = $1 AND x.kind = ANY($2) AND ${TRUSTED}
        ORDER BY x.kind, x.observed_at DESC, x.recorded_at DESC`,
      [patientId, SNAPSHOT_KINDS]
    )).rows;
    const labs: LabSnapshot = Object.fromEntries(
      labRows.map((r) => [r.kind, { kind: r.kind, value: r.value, unit: r.unit, observedAt: r.observed_at.toISOString(), channel: r.channel, code: r.code, corrected: r.corrected }])
    );
    const cgm = (await client.query<{ at: Date; mmol: number }>(
      `SELECT at, mmol::float AS mmol FROM aksh.cgm_trusted_readings WHERE patient_id = $1 AND at > $2::timestamptz - INTERVAL '14 days' AND at <= $2 ORDER BY at`,
      [patientId, now]
    )).rows;

    const born = new Date(`${p.dob}T00:00:00Z`);
    const age = Math.floor((now.getTime() - born.getTime()) / (365.25 * 86_400_000));
    const sys = obs.filter((o) => o.kind === "systolic_bp").at(-1);
    const dia = obs.filter((o) => o.kind === "diastolic_bp").at(-1);
    const hba1c = obs.filter((o) => o.kind === "hba1c").map((o) => ({ recordedAt: o.observed_at.toISOString(), valueMmolMol: o.value }));
    const conditions = [...(p.diabetes_type ? [`Diabetes (${p.diabetes_type.replace(/_/g, " ")})`] : []), ...(p.conditions ?? [])];
    const diabetic = Boolean(p.diabetes_type && p.diabetes_type !== "none");
    const patient: Patient = {
      id: p.id,
      name: `${p.given_name} ${p.family_name}`,
      nhsNumber: p.record_ref ?? "not recorded",
      dob: p.dob,
      age,
      gender: p.sex ?? "unknown",
      postcode: "",
      // No risk score is invented: HORIZON derives risk from the factors it reads; the baseline is neutral.
      oracleScore: 0,
      oracleRisk: "Low",
      activeConditions: conditions,
      activeMedications: meds.map((m) => (m.dose ? `${m.name} ${m.dose}` : m.name)),
      allergies: [],
      lastEncounterDate: obs.at(-1)?.observed_at.toISOString().slice(0, 10) ?? "",
      nextAppointmentDate: p.next_appointment ? p.next_appointment.toISOString().slice(0, 10) : undefined,
      openAiItems: 0,
      carePathways: [],
      digitalTwinPrediction: { admissionRisk14Days: 0, deteriorationSignals: [], recommendedActions: [] },
      flags: ["care_network_patient", "allergies_not_recorded"],
      clinicalProfiles: diabetic ? ["t2d"] : [],
      organisation: p.organisation ?? undefined,
      vitals: sys && dia ? { bloodPressure: `${Math.round(sys.value)}/${Math.round(dia.value)}`, heartRate: 0, temperature: 0, spo2: 0, respiratoryRate: 0, recordedAt: sys.observed_at.toISOString(), recordedBy: "care network record" } : undefined,
    };
    const careNetwork: CareNetworkDiabetesReadings = {
      glucoseReadings: cgm.map((r) => ({ recordedAt: r.at.toISOString(), glucoseMgDl: Math.round(r.mmol * MG_PER_MMOL), context: "unspecified" as const })),
      hba1cReadings: hba1c,
      labs,
    };
    return {
      patient,
      careNetwork,
      provenance: { patientSource: "care_network", glucoseSource: cgm.length ? "care_network_cgm" : "none", cgmReadings: cgm.length, hba1cReadings: hba1c.length, labResults: labRows.length },
    };
  });
}

/** Load the patient and make them resolvable by id for the agents (process-local registry, simulation only). */
export async function prepareSpinePatient(ctx: NetworkContext, patientId: string): Promise<SpinePatient> {
  const sp = await loadSpinePatient(ctx, patientId);
  registerSpinePatient(sp.patient);
  return sp;
}
