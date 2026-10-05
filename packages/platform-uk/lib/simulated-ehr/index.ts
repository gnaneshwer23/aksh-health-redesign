/**
 * Simulated EMIS Web / SystmOne chart read models.
 * Fed only from HITL Accept → BRIDGE / ehr-writeback-sim — never live partner write.
 * liveEmis:false · realPatientData:false · syntheticOnly:true
 */

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type SimulatedEhrPartner = "simulated_emis" | "simulated_systmone";

export type SimulatedEhrChartEntry = {
  id: string;
  writtenAt: string;
  patientId: string | null;
  caseId: string | null;
  partner: SimulatedEhrPartner;
  resourceType: string;
  summary: string;
  acceptedBy: string;
  clinicianId: string;
  bridgeStagingId: string | null;
  simWriteId: string | null;
  syntheticOnly: true;
  liveEmis: false;
  realPatientData: false;
  note: string;
};

export type SimulatedEhrUpsertInput = {
  patientId?: string | null;
  caseId?: string | null;
  acceptedBy: string;
  clinicianId: string;
  bridgeStagingId?: string | null;
  simWriteId?: string | null;
  bundleSummary: string;
  resourceTypes?: string[];
  scopeKey?: string;
};

const dataDir = path.join(process.cwd(), "data");
const NOTE =
  "Simulated EHR chart entry · staging rehearsal only · not live EMIS/SystmOne · liveEmis:false · realPatientData:false";

function resolveFile(scopeKey = "shared") {
  const safe = /^[a-zA-Z0-9_-]{3,64}$/.test(scopeKey) ? scopeKey : "shared";
  if (safe === "shared") return path.join(dataDir, "simulated-ehr-charts.json");
  return path.join(dataDir, `simulated-ehr-charts.${safe}.json`);
}

async function readStore(scopeKey: string): Promise<SimulatedEhrChartEntry[]> {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { entries?: SimulatedEhrChartEntry[] };
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

async function writeStore(entries: SimulatedEhrChartEntry[], scopeKey: string) {
  const file = resolveFile(scopeKey);
  await mkdir(dataDir, { recursive: true });
  await writeFile(file, JSON.stringify({ entries: entries.slice(0, 400) }, null, 2), "utf8");
}

function resourceTypesFromSummary(summary: string, explicit?: string[]): string[] {
  if (explicit?.length) return explicit;
  const known = [
    "DocumentReference",
    "Observation",
    "Condition",
    "MedicationRequest",
    "RiskAssessment",
    "Encounter",
  ];
  return known.filter((t) => summary.includes(t));
}

/**
 * Idempotent upsert: same bridgeStagingId + partner does not duplicate.
 * Writes parallel EMIS + SystmOne simulated projections (shared staging payload).
 */
export async function upsertSimulatedEhrCharts(
  input: SimulatedEhrUpsertInput
): Promise<SimulatedEhrChartEntry[]> {
  const scopeKey = input.scopeKey ?? "shared";
  const existing = await readStore(scopeKey);
  const types = resourceTypesFromSummary(input.bundleSummary, input.resourceTypes);
  const resourceTypeLabel = types.length ? types.join(", ") : "Bundle";
  const partners: SimulatedEhrPartner[] = ["simulated_emis", "simulated_systmone"];
  const created: SimulatedEhrChartEntry[] = [];

  for (const partner of partners) {
    const dup = existing.find(
      (e) =>
        e.partner === partner &&
        input.bridgeStagingId &&
        e.bridgeStagingId === input.bridgeStagingId
    );
    if (dup) {
      created.push(dup);
      continue;
    }

    const entry: SimulatedEhrChartEntry = {
      id: `sim-ehr-${randomUUID()}`,
      writtenAt: new Date().toISOString(),
      patientId: input.patientId ?? null,
      caseId: input.caseId ?? null,
      partner,
      resourceType: resourceTypeLabel,
      summary: input.bundleSummary,
      acceptedBy: input.acceptedBy,
      clinicianId: input.clinicianId,
      bridgeStagingId: input.bridgeStagingId ?? null,
      simWriteId: input.simWriteId ?? null,
      syntheticOnly: true,
      liveEmis: false,
      realPatientData: false,
      note: NOTE,
    };
    existing.unshift(entry);
    created.push(entry);
  }

  await writeStore(existing, scopeKey);
  return created;
}

export async function listSimulatedEhrCharts(options?: {
  patientId?: string;
  scopeKey?: string;
  limit?: number;
}): Promise<SimulatedEhrChartEntry[]> {
  const scopeKey = options?.scopeKey ?? "shared";
  let entries = await readStore(scopeKey);
  if (options?.patientId) {
    entries = entries.filter((e) => e.patientId === options.patientId);
  }
  return entries.slice(0, options?.limit ?? 50);
}

export async function getSimulatedEhrChartForPatient(
  patientId: string,
  options?: { scopeKey?: string }
) {
  const entries = await listSimulatedEhrCharts({
    patientId,
    scopeKey: options?.scopeKey,
    limit: 100,
  });
  return {
    patientId,
    liveEmis: false as const,
    realPatientData: false as const,
    syntheticOnly: true as const,
    partners: {
      simulated_emis: entries.filter((e) => e.partner === "simulated_emis"),
      simulated_systmone: entries.filter((e) => e.partner === "simulated_systmone"),
    },
    entries,
    note: NOTE,
  };
}

export function getSimulatedEhrHonesty() {
  return {
    liveEmis: false as const,
    realPatientData: false as const,
    syntheticOnly: true as const,
    partnerWrite: false as const,
    note: NOTE,
  };
}

/** Test helper — clears shared file store. */
export async function resetSimulatedEhrForTests(scopeKey = "shared") {
  await writeStore([], scopeKey);
}
