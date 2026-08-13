import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import {
  type ConsentGrant,
  type ConsentGrantInput,
  type PurposeCode,
  consentGrantInputSchema
} from "../precision-health/consent";
import type { ModalityId } from "../precision-health/modalities";
import { getPgPool, isPostgresConfigured } from "../db/client";
import { CONSENT_GRANTS_SQL } from "../db/schema-sql";
import { persistShieldAuditEvent } from "./shield-audit-repository";

const dataDir = path.join(process.cwd(), "data");

let consentSchemaReady: Promise<void> | null = null;

async function ensureConsentGrantSchema() {
  if (!isPostgresConfigured()) return;
  if (!consentSchemaReady) {
    consentSchemaReady = getPgPool()
      .query(CONSENT_GRANTS_SQL)
      .then(() => undefined)
      .catch((error) => {
        consentSchemaReady = null;
        throw error;
      });
  }
  await consentSchemaReady;
}

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") return path.join(dataDir, "consent-grants.json");
  return path.join(dataDir, `consent-grants.${safe}.json`);
}

async function readFileStore(scopeKey: string): Promise<ConsentGrant[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { grants?: ConsentGrant[] };
    return Array.isArray(parsed.grants) ? parsed.grants : [];
  } catch {
    return [];
  }
}

async function writeFileStore(grants: ConsentGrant[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ grants }, null, 2), "utf8");
}

function mapRow(row: {
  id: string;
  patient_id: string;
  purpose_code: string;
  modalities: string[] | null;
  status: string;
  granted_by: string;
  granted_at: Date | string;
  revoked_at: Date | string | null;
  revoked_by: string | null;
  notes: string | null;
  ehr_write: boolean;
  hitl_required: boolean;
}): ConsentGrant {
  return {
    id: row.id,
    patientId: row.patient_id,
    purposeCode: row.purpose_code as PurposeCode,
    modalities: (row.modalities ?? []) as ModalityId[],
    status: row.status === "revoked" ? "revoked" : "active",
    grantedBy: row.granted_by,
    grantedAt:
      typeof row.granted_at === "string" ? row.granted_at : row.granted_at.toISOString(),
    revokedAt: row.revoked_at
      ? typeof row.revoked_at === "string"
        ? row.revoked_at
        : row.revoked_at.toISOString()
      : null,
    revokedBy: row.revoked_by,
    notes: row.notes,
    ehrWrite: false,
    hitlRequired: true
  };
}

async function listPostgres(options: {
  scopeKey: string;
  patientId?: string;
  includeRevoked?: boolean;
}): Promise<ConsentGrant[] | null> {
  try {
    await ensureConsentGrantSchema();
    const clauses = ["scope_key = $1"];
    const params: unknown[] = [options.scopeKey];
    if (options.patientId) {
      params.push(options.patientId);
      clauses.push(`patient_id = $${params.length}`);
    }
    if (!options.includeRevoked) {
      clauses.push(`status = 'active'`);
    }
    const result = await getPgPool().query(
      `SELECT id, patient_id, purpose_code, modalities, status, granted_by, granted_at,
              revoked_at, revoked_by, notes, ehr_write, hitl_required
       FROM aksh.consent_grants
       WHERE ${clauses.join(" AND ")}
       ORDER BY granted_at DESC`,
      params
    );
    return result.rows.map(mapRow);
  } catch (error) {
    console.error("[consent] postgres list failed; falling back to file store", error);
    return null;
  }
}

async function persistPostgres(grant: ConsentGrant, scopeKey: string): Promise<boolean> {
  try {
    await ensureConsentGrantSchema();
    await getPgPool().query(
      `INSERT INTO aksh.consent_grants
         (id, scope_key, patient_id, purpose_code, modalities, status, granted_by, granted_at,
          revoked_at, revoked_by, notes, ehr_write, hitl_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         revoked_at = EXCLUDED.revoked_at,
         revoked_by = EXCLUDED.revoked_by,
         notes = EXCLUDED.notes`,
      [
        grant.id,
        scopeKey,
        grant.patientId,
        grant.purposeCode,
        grant.modalities,
        grant.status,
        grant.grantedBy,
        grant.grantedAt,
        grant.revokedAt,
        grant.revokedBy,
        grant.notes,
        grant.ehrWrite,
        grant.hitlRequired
      ]
    );
    return true;
  } catch (error) {
    console.error("[consent] postgres upsert failed; falling back to file store", error);
    return false;
  }
}

/** Persist grant to Neon when configured; otherwise (or on failure) write the local file store. */
async function persistGrant(
  grant: ConsentGrant,
  allGrants: ConsentGrant[],
  scopeKey: string
): Promise<"postgres" | "file"> {
  if (isPostgresConfigured()) {
    const ok = await persistPostgres(grant, scopeKey);
    if (ok) return "postgres";
  }
  await writeFileStore(allGrants, scopeKey);
  return "file";
}

export async function listConsentGrants(options?: {
  scopeKey?: string;
  patientId?: string;
  includeRevoked?: boolean;
}): Promise<ConsentGrant[]> {
  const scopeKey = options?.scopeKey ?? "shared";

  if (isPostgresConfigured()) {
    const rows = await listPostgres({
      scopeKey,
      patientId: options?.patientId,
      includeRevoked: options?.includeRevoked
    });
    if (rows) return rows;
  }

  let grants = await readFileStore(scopeKey);
  if (options?.patientId) {
    grants = grants.filter((g) => g.patientId === options.patientId);
  }
  if (!options?.includeRevoked) {
    grants = grants.filter((g) => g.status === "active");
  }
  return grants.sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
}

export async function upsertConsentGrant(
  input: ConsentGrantInput,
  options?: { scopeKey?: string; actor?: string }
): Promise<{ grant: ConsentGrant; action: "grant" | "revoke"; source: "postgres" | "file" }> {
  const parsed = consentGrantInputSchema.parse(input);
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? parsed.grantedBy;

  let grants: ConsentGrant[] = [];
  if (isPostgresConfigured()) {
    const rows = await listPostgres({ scopeKey, includeRevoked: true });
    grants = rows ?? (await readFileStore(scopeKey));
  } else {
    grants = await readFileStore(scopeKey);
  }

  if (parsed.revokeGrantId) {
    const existing = grants.find((g) => g.id === parsed.revokeGrantId);
    if (!existing) {
      throw new Error(`Consent grant not found: ${parsed.revokeGrantId}`);
    }
    if (existing.status === "revoked") {
      return {
        grant: existing,
        action: "revoke",
        source: isPostgresConfigured() ? "postgres" : "file"
      };
    }
    existing.status = "revoked";
    existing.revokedAt = new Date().toISOString();
    existing.revokedBy = actor;

    const source = await persistGrant(existing, grants, scopeKey);

    void persistShieldAuditEvent({
      action: "defer",
      actor,
      label: "SHIELD: consent grant revoked",
      detail: `${existing.purposeCode} · modalities=${existing.modalities.join(",")}`,
      category: "system",
      agentLabel: "SHIELD",
      resourceRef: existing.patientId,
      payload: {
        grantId: existing.id,
        purposeCode: existing.purposeCode,
        modalities: existing.modalities,
        ehrWrite: false,
        storage: source
      }
    });

    return { grant: existing, action: "revoke", source };
  }

  const grant: ConsentGrant = {
    id: `consent-${randomUUID()}`,
    patientId: parsed.patientId,
    purposeCode: parsed.purposeCode as PurposeCode,
    modalities: parsed.modalities as ModalityId[],
    status: "active",
    grantedBy: parsed.grantedBy,
    grantedAt: new Date().toISOString(),
    revokedAt: null,
    revokedBy: null,
    notes: parsed.notes ?? null,
    ehrWrite: false,
    hitlRequired: true
  };

  grants.push(grant);
  const source = await persistGrant(grant, grants, scopeKey);

  void persistShieldAuditEvent({
    action: "defer",
    actor,
    label: "SHIELD: consent grant created",
    detail: `${grant.purposeCode} · modalities=${grant.modalities.join(",")}`,
    category: "system",
    agentLabel: "SHIELD",
    resourceRef: grant.patientId,
    payload: {
      grantId: grant.id,
      purposeCode: grant.purposeCode,
      modalities: grant.modalities,
      ehrWrite: false,
      storage: source
    }
  });

  return { grant, action: "grant", source };
}
