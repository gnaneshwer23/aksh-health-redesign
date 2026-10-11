/**
 * Data export.
 * - Organisation (admins): everything the organisation holds in Aksh, as one machine-readable JSON document, for the
 *   end-of-service return in the data processing agreement (clause 10) and for the organisation's own records.
 * - Patient (self): their own record, readings and sharing decisions, to answer a data access request.
 * Both run in the caller's tenant session (row-level security decides every row) and are audited. Secrets (password
 * hashes, invite code hashes, API key hashes) are never exported.
 */
import type { PoolClient } from "pg";

import { getDeploymentEnvironment } from "@/lib/env/deployment";
import { audit, withTenant, type NetworkContext } from "@/lib/network/db";
import { getOwnRecord } from "@/lib/network/read";
import { NetworkError } from "@/lib/network/service";

export const EXPORT_FORMAT = "aksh-export-v1";

const rows = async (client: PoolClient, sql: string, params: unknown[]) => (await client.query(sql, params)).rows;

export async function exportOrganisation(ctx: NetworkContext, orgId: string) {
  if (!ctx.adminOrgIds.includes(orgId)) throw new NetworkError("Only organisation admins can export the organisation's data", 403);
  return withTenant(ctx, async (client) => {
    const patientsOf = `SELECT id FROM aksh.network_patients WHERE organisation_id = $1`;
    const data = {
      format: EXPORT_FORMAT,
      exportedAt: new Date().toISOString(),
      environment: getDeploymentEnvironment(),
      organisation: (await rows(client, `SELECT id, name, kind, status, region, locale, access_settings, created_at, verified_at FROM aksh.organisations WHERE id = $1`, [orgId]))[0] ?? null,
      members: await rows(client, `SELECT id, user_id, display_name, email, role, professional_title, is_admin, status, registration_number, registration_body, registration_status, created_at FROM aksh.memberships WHERE organisation_id = $1 ORDER BY created_at`, [orgId]),
      registrationChecks: await rows(client, `SELECT id, membership_id, outcome, registry, registration_number, checked_on, evidence_ref, note, checked_by, checked_by_kind, created_at FROM aksh.registration_checks WHERE organisation_id = $1 ORDER BY id`, [orgId]),
      invites: await rows(client, `SELECT id, kind, role, is_admin, email, patient_id, expires_at, used_at, revoked_at, created_at FROM aksh.invites WHERE organisation_id = $1 ORDER BY created_at`, [orgId]),
      patients: await rows(client, `SELECT id, record_ref, given_name, family_name, to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, sex, diabetes_type, diagnosed_on, conditions, foot_risk, last_eye_screening, next_appointment, contact, created_at FROM aksh.network_patients WHERE organisation_id = $1 ORDER BY family_name, given_name`, [orgId]),
      observations: await rows(client, `SELECT id, patient_id, kind, value, unit, observed_at, source, verified, verified_by, verified_at, status, context, flag, original_value, original_unit, recorded_at FROM aksh.network_observations WHERE patient_id IN (${patientsOf}) ORDER BY patient_id, observed_at`, [orgId]),
      medications: await rows(client, `SELECT id, patient_id, name, drug_class, dose, started_on, ended_on FROM aksh.network_medications WHERE patient_id IN (${patientsOf}) ORDER BY patient_id, name`, [orgId]),
      careTeams: await rows(client, `SELECT id, patient_id, membership_id, care_role, added_at, ended_at FROM aksh.care_team_members WHERE patient_id IN (${patientsOf}) ORDER BY patient_id`, [orgId]),
      consents: await rows(client, `SELECT id, patient_id, grantee_organisation_id, purpose, status, basis, recorded_at FROM aksh.consent_records WHERE patient_id IN (${patientsOf}) ORDER BY recorded_at`, [orgId]),
      waitlist: await rows(client, `SELECT * FROM aksh.waitlist_entries WHERE organisation_id = $1 ORDER BY added_at`, [orgId]),
      slots: await rows(client, `SELECT * FROM aksh.access_slots WHERE organisation_id = $1 ORDER BY received_at`, [orgId]),
      workflows: await rows(client, `SELECT * FROM aksh.access_workflows WHERE organisation_id = $1 ORDER BY created_at`, [orgId]),
      candidates: await rows(client, `SELECT * FROM aksh.access_candidates WHERE organisation_id = $1`, [orgId]),
      actions: await rows(client, `SELECT * FROM aksh.access_actions WHERE organisation_id = $1 ORDER BY created_at`, [orgId]),
      handoffs: await rows(client, `SELECT * FROM aksh.handoff_tasks WHERE organisation_id = $1 ORDER BY created_at`, [orgId]),
      goLive: await rows(client, `SELECT id, item_key, action, evidence, note, actor_user_id, actor_kind, created_at FROM aksh.golive_events WHERE organisation_id = $1 ORDER BY id`, [orgId]),
      connections: await rows(client, `SELECT id, name, key_prefix, config, created_by, created_at, last_used_at, revoked_at FROM aksh.connector_keys WHERE organisation_id = $1`, [orgId]),
      connectorMessages: await rows(client, `SELECT id, key_id, kind, format, external_ref, result_code, detail, workflow_id, received_at FROM aksh.connector_events WHERE organisation_id = $1 ORDER BY id`, [orgId]),
      cgmUploads: await rows(client, `SELECT u.id, u.patient_id, u.uploaded_by, u.uploader_kind, u.format, u.filename, u.timezone, u.rows_read, u.first_at, u.last_at, u.created_at, v.reviewed_by, v.reviewed_at FROM aksh.cgm_uploads u LEFT JOIN aksh.cgm_upload_reviews v ON v.upload_id = u.id WHERE u.patient_id IN (${patientsOf}) ORDER BY u.created_at`, [orgId]),
      cgmReadings: await rows(client, `SELECT patient_id, at, mmol, censored, upload_id FROM aksh.cgm_readings WHERE patient_id IN (${patientsOf}) ORDER BY patient_id, at`, [orgId]),
      auditTrail: await rows(client, `SELECT id, actor_user_id, action, resource_type, resource_id, detail, environment, occurred_at FROM aksh.network_audit_events WHERE organisation_id = $1 ORDER BY id`, [orgId]),
    };
    await audit(client, { organisationId: orgId, actorUserId: ctx.userId, action: "organisation.exported", resourceType: "organisation", resourceId: orgId, detail: { patients: data.patients.length, observations: data.observations.length, cgmReadings: data.cgmReadings.length } });
    return data;
  });
}

/** The signed-in patient's own data (subject access). */
export async function exportOwnData(ctx: NetworkContext, email: string) {
  if (ctx.role !== "patient") throw new NetworkError("Patient accounts only", 403);
  const record = await getOwnRecord(ctx);
  const patientId = ctx.patientIds[0];
  return withTenant(ctx, async (client) => {
    const data = {
      format: EXPORT_FORMAT,
      exportedAt: new Date().toISOString(),
      account: { id: ctx.userId, email },
      record,
      // The stored record as held (date of birth, contact details), not only the display summary above.
      storedRecord: patientId
        ? (await rows(client, `SELECT record_ref, given_name, family_name, to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth, sex, diabetes_type, diagnosed_on, conditions, contact FROM aksh.network_patients WHERE id = $1`, [patientId]))[0] ?? null
        : null,
      readings: patientId
        ? await rows(client, `SELECT id, kind, value, unit, original_value, original_unit, context, flag, observed_at, source, verified, status, recorded_at FROM aksh.network_observations WHERE patient_id = $1 ORDER BY observed_at`, [patientId])
        : [],
      readingsNotShared: await rows(client, `SELECT id, kind, value, unit, original_value, original_unit, context, flag, observed_at, status, shared_at FROM aksh.personal_readings WHERE user_id = $1 ORDER BY observed_at`, [ctx.userId]),
      cgmReadings: patientId ? await rows(client, `SELECT at, mmol, censored FROM aksh.cgm_readings WHERE patient_id = $1 ORDER BY at`, [patientId]) : [],
      sharingDecisions: patientId
        ? await rows(client, `SELECT grantee_organisation_id, purpose, status, basis, recorded_at FROM aksh.consent_records WHERE patient_id = $1 ORDER BY recorded_at`, [patientId])
        : [],
    };
    await audit(client, { organisationId: null, actorUserId: ctx.userId, action: "patient.exported_own_data", resourceType: "user", resourceId: ctx.userId });
    return data;
  });
}
