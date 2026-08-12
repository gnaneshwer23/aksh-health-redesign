import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { isE2EAdminSurfaceAllowed } from "@/lib/e2e/env";
import { findDelayedLabs, completeLabResult, LAB_SIM_HONESTY } from "@/lib/e2e/lab-sim";
import {
  createCoordinationTaskFromPharmacyEvent,
  findAdherenceFailures,
  escalateCoordinationTaskToClinician,
  PHARMACY_SIM_HONESTY,
} from "@/lib/e2e/pharmacy-sim";
import { resolveCareTeam, routePharmacyTaskToCareTeam, CARE_TEAM_SIM_HONESTY } from "@/lib/e2e/care-team-sim";
import { generateE2EDataset } from "@/lib/e2e/generator";
import type { E2ELabEvent, E2EPharmacyEvent, E2EPatientProfile, E2EUserSpec } from "@/lib/e2e/types";
import { requireAppRole } from "@/lib/user-scope";

export const dynamic = "force-dynamic";

async function loadBatchArtifacts() {
  try {
    const latestPath = path.join(process.cwd(), "data", "e2e", "latest-batch.json");
    const latest = JSON.parse(await readFile(latestPath, "utf8")) as { batchId: string };
    const dir = path.join(process.cwd(), "data", "e2e", latest.batchId);
    const [labEvents, pharmacyEvents, patients, users] = await Promise.all([
      readFile(path.join(dir, "labEvents.json"), "utf8").then((t) => JSON.parse(t) as E2ELabEvent[]),
      readFile(path.join(dir, "pharmacyEvents.json"), "utf8").then(
        (t) => JSON.parse(t) as E2EPharmacyEvent[]
      ),
      readFile(path.join(dir, "patients.json"), "utf8").then((t) => JSON.parse(t) as E2EPatientProfile[]),
      readFile(path.join(dir, "users.json"), "utf8").then((t) => JSON.parse(t) as E2EUserSpec[]),
    ]);
    return { batchId: latest.batchId, labEvents, pharmacyEvents, patients, users, source: "artifacts" as const };
  } catch {
    const dataset = generateE2EDataset({ seed: 20260812 });
    return {
      batchId: dataset.manifest.batchId,
      labEvents: dataset.labEvents,
      pharmacyEvents: dataset.pharmacyEvents,
      patients: dataset.patients,
      users: dataset.users,
      source: "generator" as const,
    };
  }
}

/**
 * GET /api/admin/e2e/sims — summary of lab/pharmacy/care-team sim surfaces (E2E only).
 */
export async function GET(request: Request) {
  if (!isE2EAdminSurfaceAllowed()) {
    return NextResponse.json(
      { error: "E2E sim surface disabled", liveEmis: false, liveNhsLab: false },
      { status: 403 }
    );
  }

  const auth = await requireAppRole(request, ["operations_lead", "clinical_reviewer"]);
  if (auth.response || !auth.context) return auth.response;

  const batch = await loadBatchArtifacts();
  const delayed = findDelayedLabs(batch.labEvents);
  const adherence = findAdherenceFailures(batch.pharmacyEvents);

  return NextResponse.json({
    allowed: true,
    ...LAB_SIM_HONESTY,
    ...PHARMACY_SIM_HONESTY,
    ...CARE_TEAM_SIM_HONESTY,
    batchId: batch.batchId,
    source: batch.source,
    counts: {
      labEvents: batch.labEvents.length,
      delayedLabs: delayed.length,
      pharmacyEvents: batch.pharmacyEvents.length,
      adherenceFailures: adherence.length,
      patients: batch.patients.length,
      users: batch.users.length,
    },
    sampleDelayedLabIds: delayed.slice(0, 5).map((e) => e.id),
    sampleAdherenceEventIds: adherence.slice(0, 5).map((e) => e.id),
  });
}

/**
 * POST /api/admin/e2e/sims — advance a simulated lab or pharmacy workflow (no live systems).
 */
export async function POST(request: Request) {
  if (!isE2EAdminSurfaceAllowed()) {
    return NextResponse.json(
      { error: "E2E sim surface disabled", liveEmis: false, liveNhsLab: false },
      { status: 403 }
    );
  }

  const auth = await requireAppRole(request, ["operations_lead", "clinical_reviewer"]);
  if (auth.response || !auth.context) return auth.response;

  let body: {
    action?: string;
    labEventId?: string;
    pharmacyEventId?: string;
    patientId?: string;
    value?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const batch = await loadBatchArtifacts();
  const actor = auth.context.userEmail ?? auth.context.userId;

  if (body.action === "complete-lab") {
    const event = batch.labEvents.find((e) => e.id === body.labEventId);
    if (!event) {
      return NextResponse.json({ error: "Unknown labEventId" }, { status: 404 });
    }
    if (typeof body.value !== "number") {
      return NextResponse.json({ error: "value is required to complete a lab" }, { status: 400 });
    }
    const result = completeLabResult({ event, value: body.value, actor, batchId: batch.batchId });
    return NextResponse.json({
      action: "complete-lab",
      result,
      liveNhsLab: false,
      liveEmis: false,
      ehrWrite: false,
    });
  }

  if (body.action === "pharmacy-escalate") {
    const event = batch.pharmacyEvents.find((e) => e.id === body.pharmacyEventId);
    if (!event) {
      return NextResponse.json({ error: "Unknown pharmacyEventId" }, { status: 404 });
    }
    const patient =
      batch.patients.find((p) => p.id === event.patientId) ??
      batch.patients.find((p) => p.id === body.patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found for pharmacy event" }, { status: 404 });
    }
    let task = createCoordinationTaskFromPharmacyEvent({ event, actor });
    task = escalateCoordinationTaskToClinician(task, actor);
    const careTeam = resolveCareTeam(patient, batch.users);
    const followUp = routePharmacyTaskToCareTeam({ task, careTeam });
    return NextResponse.json({
      action: "pharmacy-escalate",
      task,
      followUp,
      careTeam: {
        patientId: careTeam.patientId,
        memberCount: careTeam.members.length,
        primaryDoctorId: careTeam.primaryDoctorId,
        liveDirectory: false,
      },
      livePrescribing: false,
      liveEmis: false,
      ehrWrite: false,
    });
  }

  return NextResponse.json(
    { error: "Unknown action. Use complete-lab or pharmacy-escalate." },
    { status: 400 }
  );
}
