/**
 * Simulated EHR write-back test double.
 * Proves architecture: only accepts writes with a valid clinician approval token.
 * NEVER calls live EMIS / SystmOne. Not a production integration.
 */

import { createHash, randomUUID } from "crypto";

export type ClinicianApprovalToken = {
  token: string;
  issuedAt: string;
  clinicianId: string;
  clinicianName: string;
  caseId?: string;
  queueItemId?: string;
  resourceSummary: string;
  expiresAt: string;
};

export type SimulatedEhrWrite = {
  id: string;
  writtenAt: string;
  approvalToken: string;
  clinicianId: string;
  resourceSummary: string;
  caseId?: string;
  liveEmis: false;
  note: string;
};

const approvals = new Map<string, ClinicianApprovalToken>();
const writes: SimulatedEhrWrite[] = [];

const DEFAULT_TTL_MS = 15 * 60 * 1000;

function hashToken(parts: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

/** Issue a short-lived approval token after named clinician Accept. */
export function issueClinicianApprovalToken(input: {
  clinicianId: string;
  clinicianName: string;
  resourceSummary: string;
  caseId?: string;
  queueItemId?: string;
  ttlMs?: number;
}): ClinicianApprovalToken {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)).toISOString();
  const token = `hitl-approve-${hashToken({
    issuedAt,
    clinicianId: input.clinicianId,
    caseId: input.caseId ?? null,
    queueItemId: input.queueItemId ?? null,
    nonce: randomUUID()
  }).slice(0, 32)}`;

  const record: ClinicianApprovalToken = {
    token,
    issuedAt,
    clinicianId: input.clinicianId,
    clinicianName: input.clinicianName,
    caseId: input.caseId,
    queueItemId: input.queueItemId,
    resourceSummary: input.resourceSummary,
    expiresAt
  };
  approvals.set(token, record);
  return record;
}

export function peekApprovalToken(token: string) {
  return approvals.get(token) ?? null;
}

export type SimulatedWriteResult =
  | { ok: true; write: SimulatedEhrWrite }
  | { ok: false; status: 401 | 403 | 409; error: string };

/**
 * Attempt a simulated EHR write. Rejects missing/expired/unknown tokens.
 * Always returns liveEmis: false.
 */
export function attemptSimulatedEhrWrite(input: {
  approvalToken?: string;
  resourceSummary?: string;
  actorId?: string;
}): SimulatedWriteResult {
  const token = input.approvalToken?.trim();
  if (!token) {
    return { ok: false, status: 401, error: "Missing clinician approval token." };
  }

  const approval = approvals.get(token);
  if (!approval) {
    return { ok: false, status: 403, error: "Unknown or revoked approval token." };
  }

  if (Date.parse(approval.expiresAt) < Date.now()) {
    return { ok: false, status: 403, error: "Approval token expired." };
  }

  if (input.actorId && input.actorId !== approval.clinicianId) {
    return { ok: false, status: 403, error: "Actor does not match named clinician on approval token." };
  }

  // Idempotency: same token cannot write twice
  if (writes.some((w) => w.approvalToken === token)) {
    return { ok: false, status: 409, error: "Approval token already consumed." };
  }

  const write: SimulatedEhrWrite = {
    id: `sim-ehr-${randomUUID()}`,
    writtenAt: new Date().toISOString(),
    approvalToken: token,
    clinicianId: approval.clinicianId,
    resourceSummary: input.resourceSummary?.trim() || approval.resourceSummary,
    caseId: approval.caseId,
    liveEmis: false,
    note: "Simulated EHR write only — no EMIS Partner API call."
  };
  writes.unshift(write);
  if (writes.length > 200) writes.length = 200;
  return { ok: true, write };
}

export function listSimulatedEhrWrites(limit = 20) {
  return writes.slice(0, limit);
}

export function getEhrWritebackSimStatus() {
  return {
    adapterId: "ehr-writeback-sim",
    liveEmis: false,
    liveWriteBack: false,
    approvalTokensIssued: approvals.size,
    simulatedWrites: writes.length,
    note: "Local test double proving HITL-gated write architecture. Not EMIS."
  };
}

/** Test helper — clear in-memory state between unit tests. */
export function resetEhrWritebackSimForTests() {
  approvals.clear();
  writes.length = 0;
}
