/**
 * Self-serve sandbox: a new professional gets their own organisation (status "sandbox", they are its admin), filled
 * with sample patients, a waiting list and freed slots so every workflow can be tried immediately. Sample people are
 * fictional and live only inside this organisation; real patient data needs the organisation to go live.
 */
import { addToWaitlist, ingestSlot } from "@/lib/access/service";
import { getSyntheticWorld } from "@/lib/synthetic-world/generate";

import { loadNetworkContext } from "./context";
import { createOrganisation, importPatients } from "./service";

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
  const imported = await importPatients(ctx, org.id, {
    patients: sample.map((p) => ({
      recordRef: `SAMPLE-${p.id}`,
      givenName: p.givenName,
      familyName: p.familyName,
      dateOfBirth: p.dob,
      sex: p.sex,
      diabetesType: p.diabetesType,
      diagnosedOn: `${p.diagnosedYear}-01-01`,
      conditions: p.comorbidities,
      footRisk: p.footRisk,
      lastEyeScreening: p.lastEyeScreening,
      contact: { preferredChannel: p.contactPreference },
      observations: [
        ...p.hba1c.map((h) => ({ kind: "hba1c" as const, value: h.hba1cMmolMol, unit: "mmol/mol", observedAt: h.date, source: "lab" as const })),
        { kind: "egfr" as const, value: p.egfr, unit: "mL/min/1.73m2", observedAt: p.hba1c[p.hba1c.length - 1]!.date, source: "lab" as const },
        { kind: "systolic_bp" as const, value: p.bloodPressure.systolic, unit: "mmHg", observedAt: p.hba1c[p.hba1c.length - 1]!.date, source: "clinic" as const },
        { kind: "diastolic_bp" as const, value: p.bloodPressure.diastolic, unit: "mmHg", observedAt: p.hba1c[p.hba1c.length - 1]!.date, source: "clinic" as const },
        ...(p.cgm ? [{ kind: "cgm_time_in_range" as const, value: p.cgm.timeInRangePct, unit: "%", observedAt: p.cgm.lastSync, source: "device" as const }] : []),
      ],
      medications: p.medications.map((m) => ({ name: m.name, drugClass: m.class, dose: m.dose, startedOn: m.since })),
    })),
  });

  // Slot fill is a staff workflow; other roles get the sample patients only.
  if (!["gp", "nurse", "clinical-pharmacist", "practice-manager"].includes(actor.role ?? "")) return { organisationId: org.id, created: true };

  // Waiting list from open care gaps, then a few freed slots for the most requested types.
  const ids = new Map(imported.map((r) => [r.recordRef, r.id]));
  const demand = new Map<string, number>();
  for (const p of sample) {
    const gap = p.openCareGaps.find((g) => GAP_TO_TYPE[g]);
    if (!gap) continue;
    const type = GAP_TO_TYPE[gap]!;
    await addToWaitlist(ctx, org.id, {
      patientId: ids.get(`SAMPLE-${p.id}`)!,
      appointmentType: type,
      reason: "overdue_care",
      careGap: gap,
      contactChannel: p.contactPreference === "app" ? undefined : p.contactPreference,
    });
    demand.set(type, (demand.get(type) ?? 0) + 1);
  }
  const types = [...demand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
  for (const [i, type] of types.entries()) {
    const startsAt = new Date(Date.now() + (28 + i * 24) * 3_600_000);
    startsAt.setUTCMinutes(0, 0, 0);
    await ingestSlot(ctx, org.id, {
      source: "simulation",
      sourceRef: `sandbox-${org.id}-${i}`,
      sourceVersion: 1,
      appointmentType: type,
      site: "Main site",
      startsAt: startsAt.toISOString(),
      durationMin: 20,
      offerExpiresAt: new Date(startsAt.getTime() - 4 * 3_600_000).toISOString(),
    });
  }
  return { organisationId: org.id, created: true };
}
