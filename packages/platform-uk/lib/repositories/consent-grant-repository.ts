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

/** Best-effort durable mirror of a consent grant to Neon. Never throws into clinical paths. */
async function mirrorConsentGrantToPostgres(grant: ConsentGrant, scopeKey: string) {
  if (!isPostgresConfigured()) return;
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
         revoked_by = EXCLUDED.revoked_by`,
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
  } catch (error) {
    console.error("[consent] durable mirror failed; file store remains source of truth", error);
  }
}

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") return path.join(dataDir, "consent-grants.json");
  return path.join(dataDir, `consent-grants.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<ConsentGrant[]> {
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

async function writeStore(grants: ConsentGrant[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ grants }, null, 2), "utf8");
}

export async function listConsentGrants(options?: {
  scopeKey?: string;
  patientId?: string;
  includeRevoked?: boolean;
}): Promise<ConsentGrant[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  let grants = await readStore(scopeKey);
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
): Promise<{ grant: ConsentGrant; action: "grant" | "revoke" }> {
  const parsed = consentGrantInputSchema.parse(input);
  const scopeKey = options?.scopeKey ?? "shared";
  const actor = options?.actor ?? parsed.grantedBy;
  const grants = await readStore(scopeKey);

  if (parsed.revokeGrantId) {
    const existing = grants.find((g) => g.id === parsed.revokeGrantId);
    if (!existing) {
      throw new Error(`Consent grant not found: ${parsed.revokeGrantId}`);
    }
    if (existing.status === "revoked") {
      return { grant: existing, action: "revoke" };
    }
    existing.status = "revoked";
    existing.revokedAt = new Date().toISOString();
    existing.revokedBy = actor;
    await writeStore(grants, scopeKey);
    void mirrorConsentGrantToPostgres(existing, scopeKey);

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
        ehrWrite: false
      }
    });

    return { grant: existing, action: "revoke" };
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
  await writeStore(grants, scopeKey);
  void mirrorConsentGrantToPostgres(grant, scopeKey);

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
      ehrWrite: false
    }
  });

  return { grant, action: "grant" };
}
