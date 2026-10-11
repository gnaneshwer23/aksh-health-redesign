/**
 * Self-serve sandbox: a new professional gets their own organisation (status "sandbox", they are its admin), filled
 * with sample patients, a waiting list and freed slots so every workflow can be tried immediately. Sample people are
 * fictional and live only inside this organisation; real patient data needs the organisation to go live.
 */
import { RULE_VERSION } from "@/lib/access/eligibility";
import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { getSyntheticWorld } from "@/lib/synthetic-world/generate";

import { loadNetworkContext } from "./context";
import { withTenant } from "./db";
import { createOrganisation } from "./service";

const SANDBOX_PATIENTS = 24;

const GAP_TO_TYPE: Record<string, string> = {
  "HbA1c due": "hba1c_check",
  "Eye screening overdue": "eye_screening",
  "Annual foot check due": "foot_check",
  "Blood pressure above target": "diabetes_review",
  "Statin not recorded": "medication_review",
};

export async function provisionSandbox(actor: { userId: string; email: string; displayName: string; role: string | null }, options: { organisationName?: string; withSampleData: boolean }) {
  const existing = await loadNetworkContext(actor.userId, actor.role);
  if (existing.orgIds.length) return { organisationId: existing.orgIds[0]!, created: false };

  const firstName = actor.displayName.split(/\s+/)[0] ?? "My";
  const org = await createOrganisation(actor, {
    name: options.organisationName?.trim() || `${firstName}’s sandbox clinic`,
    kind: "clinic",
    locale: { timezone: "UTC", glucoseUnit: "mmol/L", hba1cUnit: "mmol/mol" },
  });
  if (!options.withSampleData) return { organisationId: org.id, created: true };

  const ctx = await loadNetworkContext(actor.userId, actor.role);
  // A spread of sample patients from the deterministic generator (fictional; same rules as real records).
  const world = getSyntheticWorld();
  const sample = world.patients.filter((_, i) => i % Math.floor(world.patients.length / SANDBOX_PATIENTS) === 0).slice(0, SANDBOX_PATIENTS);
  const staff = ["gp", "nurse", "clinical-pharmacist", "practice-manager"].includes(actor.role ?? "");

  const patients = sample.map((p) => ({
    record_ref: `SAMPLE-${p.id}`,
    given_name: p.givenName,
    family_name: p.familyName,
    date_of_birth: p.dob,
    sex: p.sex,
    diabetes_type: p.diabetesType,
    diagnosed_on: `${p.diagnosedYear}-01-01`,
    conditions: p.comorbidities,
    foot_risk: p.footRisk,
    last_eye_screening: p.lastEyeScreening,
    contact: { preferredChannel: p.contactPreference },
  }));
  const observations = sample.flatMap((p) => {
    const last = p.hba1c[p.hba1c.length - 1]!.date;
    return [
      ...p.hba1c.map((h) => ({ record_ref: `SAMPLE-${p.id}`, kind: "hba1c", value: h.hba1cMmolMol, unit: "mmol/mol", observed_at: h.date, source: "lab" })),
      { record_ref: `SAMPLE-${p.id}`, kind: "egfr", value: p.egfr, unit: "mL/min/1.73m2", observed_at: last, source: "lab" },
      { record_ref: `SAMPLE-${p.id}`, kind: "systolic_bp", value: p.bloodPressure.systolic, unit: "mmHg", observed_at: last, source: "clinic" },
      { record_ref: `SAMPLE-${p.id}`, kind: "diastolic_bp", value: p.bloodPressure.diastolic, unit: "mmHg", observed_at: last, source: "clinic" },
      ...(p.cgm ? [{ record_ref: `SAMPLE-${p.id}`, kind: "cgm_time_in_range", value: p.cgm.timeInRangePct, unit: "%", observed_at: p.cgm.lastSync, source: "device" }] : []),
    ];
  });
  const medications = sample.flatMap((p) => p.medications.map((m) => ({ record_ref: `SAMPLE-${p.id}`, name: m.name, drug_class: m.class, dose: m.dose, started_on: m.since })));
  const waitlist = sample.flatMap((p) => {
    const gap = p.openCareGaps.find((g) => GAP_TO_TYPE[g]);
    return gap ? [{ record_ref: `SAMPLE-${p.id}`, appointment_type: GAP_TO_TYPE[gap]!, care_gap: gap, contact_channel: p.contactPreference === "app" ? null : p.contactPreference }] : [];
  });
  const demand = new Map<string, number>();
  for (const w of waitlist) demand.set(w.appointment_type, (demand.get(w.appointment_type) ?? 0) + 1);
  const slots = [...demand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type], i) => {
    const startsAt = new Date(Date.now() + (28 + i * 24) * 3_600_000);
    startsAt.setUTCMinutes(0, 0, 0);
    return { source_ref: `sandbox-${org.id}-${i}`, appointment_type: type, starts_at: startsAt.toISOString(), offer_expires_at: new Date(startsAt.getTime() - 4 * 3_600_000).toISOString() };
  });

  // One transaction, set-based inserts (about ten round trips regardless of distance to the database), under the
  // same row-level security as every other tenant write.
  await withTenant(ctx, async (client) => {
    await client.query(
      `INSERT INTO aksh.network_patients (organisation_id, record_ref, given_name, family_name, date_of_birth, sex, diabetes_type, diagnosed_on, conditions, foot_risk, last_eye_screening, contact, created_by)
       SELECT $1, x.record_ref, x.given_name, x.family_name, x.date_of_birth, x.sex, x.diabetes_type, x.diagnosed_on,
              ARRAY(SELECT jsonb_array_elements_text(x.conditions)), x.foot_risk, x.last_eye_screening, x.contact, $2
       FROM jsonb_to_recordset($3::jsonb) AS x(record_ref text, given_name text, family_name text, date_of_birth date, sex text, diabetes_type text,
            diagnosed_on date, conditions jsonb, foot_risk text, last_eye_screening date, contact jsonb)`,
      [org.id, actor.userId, JSON.stringify(patients)]
    );
    await client.query(
      `INSERT INTO aksh.network_observations (patient_id, kind, value, unit, observed_at, source, verified, recorded_by)
       SELECT p.id, x.kind, x.value, x.unit, x.observed_at, x.source, x.source IN ('lab', 'clinic'), $2
       FROM jsonb_to_recordset($3::jsonb) AS x(record_ref text, kind text, value numeric, unit text, observed_at timestamptz, source text)
       JOIN aksh.network_patients p ON p.organisation_id = $1 AND p.record_ref = x.record_ref`,
      [org.id, actor.userId, JSON.stringify(observations)]
    );
    await client.query(
      `INSERT INTO aksh.network_medications (patient_id, name, drug_class, dose, started_on, recorded_by)
       SELECT p.id, x.name, x.drug_class, x.dose, x.started_on, $2
       FROM jsonb_to_recordset($3::jsonb) AS x(record_ref text, name text, drug_class text, dose text, started_on date)
       JOIN aksh.network_patients p ON p.organisation_id = $1 AND p.record_ref = x.record_ref`,
      [org.id, actor.userId, JSON.stringify(medications)]
    );
    // Slot fill is a staff workflow; other roles get the sample patients only.
    if (!staff) return;
    await client.query(
      `INSERT INTO aksh.waitlist_entries (organisation_id, patient_id, appointment_type, reason, care_gap, contact_channel, added_by)
       SELECT $1, p.id, x.appointment_type, 'overdue_care', x.care_gap, x.contact_channel, $2
       FROM jsonb_to_recordset($3::jsonb) AS x(record_ref text, appointment_type text, care_gap text, contact_channel text)
       JOIN aksh.network_patients p ON p.organisation_id = $1 AND p.record_ref = x.record_ref`,
      [org.id, actor.userId, JSON.stringify(waitlist)]
    );
    await client.query(
      `WITH s AS (
         INSERT INTO aksh.access_slots (organisation_id, source, source_ref, source_version, appointment_type, site, starts_at, duration_min, offer_expires_at)
         SELECT $1, 'simulation', x.source_ref, 1, x.appointment_type, 'Main site', x.starts_at, 20, x.offer_expires_at
         FROM jsonb_to_recordset($2::jsonb) AS x(source_ref text, appointment_type text, starts_at timestamptz, offer_expires_at timestamptz)
         RETURNING id, source_ref
       ), w AS (
         INSERT INTO aksh.access_workflows (organisation_id, slot_id, state, rule_version, environment)
         SELECT $1, s.id, 'SOURCE_VALIDATED', $3, $4 FROM s RETURNING id, slot_id
       )
       INSERT INTO aksh.access_actions (organisation_id, workflow_id, action_type, idempotency_key, actor_user_id, from_state, to_state, result_code, environment)
       SELECT $1, w.id, 'ingest', 'ingest:' || $1 || ':simulation:' || s.source_ref || ':1', $5, 'RECEIVED', 'SOURCE_VALIDATED', 'OK', $4
       FROM w JOIN s ON s.id = w.slot_id`,
      [org.id, JSON.stringify(slots), RULE_VERSION, getDeploymentEnvironment(), actor.userId]
    );
  });
  return { organisationId: org.id, created: true };
}
