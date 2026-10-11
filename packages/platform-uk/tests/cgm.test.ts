/**
 * CGM: export parsing (Dexcom Clarity-like, LibreView-like, generic), time zones and daylight saving, ambiguous dates,
 * consensus metrics on a known distribution, AGP; then the database path for patient and clinic uploads.
 * Fixtures follow the published layouts; validate with real exports from each device before go-live.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { agp, computeMetrics, samplingInterval } from "../lib/cgm/metrics";
import { detectDateOrder, parseCgmExport, zonedToInstant } from "../lib/cgm/parse";
import { commitUpload, getCgm, previewUpload } from "../lib/cgm/service";
import { closePgPool, getPgPool, isPostgresConfigured } from "../lib/db/client";
import { assertNotProductionDatabase } from "../lib/db/deployment-guard";
import { assertSeedingAllowed } from "../lib/env/deployment";
import { updateOrganisation } from "../lib/network/admin";
import { loadNetworkContext } from "../lib/network/context";
import { getPatientDetail } from "../lib/network/read";
import { acceptPatientInvite, createInvite, createOrganisation, importPatients } from "../lib/network/service";

const pad = (n: number) => String(n).padStart(2, "0");

/** 14 days of 5-minute readings ending yesterday, local Europe/London wall-clock times, cycling through a known mix. */
function dexcomFixture(days = 14) {
  const lines = [
    "Index,Timestamp (YYYY-MM-DDThh:mm:ss),Event Type,Event Subtype,Patient Info,Device Info,Source Device ID,Glucose Value (mg/dL),Insulin Value (u),Carb Value (grams),Duration (hh:mm:ss),Glucose Rate of Change (mg/dL/min),Transmitter Time (Long Integer),Transmitter ID",
    "1,,FirstName,,Test,,,,,,,,,",
    "2,,Device,,,G7,Android G7,,,,,,,",
  ];
  // mg/dL cycle of 20 values: 1 very low (50), 1 low (65), 14 in range (120), 3 high (200), 1 very high (300)
  const cycle = [50, 65, ...Array(14).fill(120), 200, 200, 200, 300];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end.getTime() - days * 86_400_000);
  let i = 0;
  for (let t = start.getTime(); t < end.getTime(); t += 5 * 60_000, i++) {
    const d = new Date(t);
    // Write London wall-clock time without offset, as Clarity does.
    const local = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(d);
    const p = Object.fromEntries(local.map((x) => [x.type, x.value]));
    const value = i === 7 ? "Low" : String(cycle[i % cycle.length]);
    lines.push(`${i + 3},${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second},EGV,,,,G7,${value},,,,,,`);
    if (i % 100 === 0) lines.push(`${i + 3}x,${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00,Alert,High,,,,,,,,,,`);
  }
  return lines.join("\n");
}

function pure() {
  // Time zones: London in winter (UTC+0) and summer (UTC+1), and the spring-forward day.
  assert.equal(zonedToInstant({ y: 2026, mo: 1, d: 15, h: 9, mi: 0, s: 0 }, "Europe/London")!.toISOString(), "2026-01-15T09:00:00.000Z");
  assert.equal(zonedToInstant({ y: 2026, mo: 7, d: 15, h: 9, mi: 0, s: 0 }, "Europe/London")!.toISOString(), "2026-07-15T08:00:00.000Z");
  assert.equal(zonedToInstant({ y: 2026, mo: 7, d: 15, h: 9, mi: 0, s: 0 }, "Asia/Kolkata")!.toISOString(), "2026-07-15T03:30:00.000Z");
  assert.equal(zonedToInstant({ y: 2026, mo: 4, d: 31, h: 9, mi: 0, s: 0 }, "UTC"), null, "31 April is not a date");
  assert.equal(detectDateOrder(["13-10-2026 08:00", "01-10-2026 08:15"]), "dmy");
  assert.equal(detectDateOrder(["10/13/2026 8:00 AM"]), "mdy");
  assert.equal(detectDateOrder(["01-02-2026 08:00"]), "ambiguous");

  // Dexcom-like: metadata rows and alerts skipped, "Low" kept as censored, mg/dL converted, London time applied.
  const dx = parseCgmExport(dexcomFixture(), "Europe/London");
  assert.ok(dx.ok, dx.problem);
  assert.equal(dx.format, "dexcom_clarity");
  assert.equal(dx.unit, "mg/dL");
  assert.equal(dx.rows.length, 14 * 288);
  assert.equal(dx.rows.filter((r) => r.censored === "below_range").length, 1);
  assert.equal(samplingInterval(dx.rows), 5);
  const m = computeMetrics(dx.rows, 14, Date.parse(dx.rows[dx.rows.length - 1]!.at) + 1)!;
  assert.ok(m.sufficient, m.flags.join("; "));
  // Known mix: very low 5%, low 5%, in range 70%, high 15%, very high 5% (±0.2 for the one censored row).
  assert.ok(Math.abs(m.pct.veryLow - 5) < 0.3 && Math.abs(m.pct.low - 5) < 0.3, JSON.stringify(m.pct));
  assert.ok(Math.abs(m.pct.inRange - 70) < 0.3 && Math.abs(m.pct.high - 15) < 0.3 && Math.abs(m.pct.veryHigh - 5) < 0.3, JSON.stringify(m.pct));
  assert.ok(m.flags.includes("time below 3.0 mmol/L is 1% or more"));
  assert.ok(m.flags.includes("time below range is 4% or more"));
  assert.ok(m.gmiMmolMol > 40 && m.gmiMmolMol < 70);
  const profile = agp(dx.rows, "Europe/London");
  assert.equal(profile.length, 24);
  assert.ok(profile.every((h) => h.n > 0 && h.p5 <= h.p50 && h.p50 <= h.p95));

  // LibreView-like: an extra first row, historic (0) rows only, scans (1) ignored, day-first dates, mmol/L.
  const libre = [
    "Glucose Data,Generated on,13-10-2026 10:00 UTC,Generated by,Test",
    "Device,Serial Number,Device Timestamp,Record Type,Historic Glucose mmol/L,Scan Glucose mmol/L,Non-numeric Rapid-Acting Insulin",
    "FreeStyle Libre 2,ABC123,13-10-2026 08:00,0,6.1,,",
    "FreeStyle Libre 2,ABC123,13-10-2026 08:15,0,6.4,,",
    "FreeStyle Libre 2,ABC123,13-10-2026 08:20,1,,6.6,",
    "FreeStyle Libre 2,ABC123,13-10-2026 08:30,0,3.4,,",
  ].join("\n");
  const lv = parseCgmExport(libre, "Asia/Kolkata");
  assert.ok(lv.ok && lv.format === "libreview" && lv.unit === "mmol/L" && lv.dateOrder === "dmy");
  assert.deepEqual(lv.rows.map((r) => [r.at, r.mmol]), [["2026-10-13T02:30:00.000Z", 6.1], ["2026-10-13T02:45:00.000Z", 6.4], ["2026-10-13T03:00:00.000Z", 3.4]]);

  // Ambiguous dates are not guessed; the user chooses.
  const amb = parseCgmExport("Device Timestamp,Record Type,Historic Glucose mmol/L\n01-02-2026 08:00,0,6.0", "UTC");
  assert.equal(amb.ok, false);
  assert.equal(amb.dateOrder, "ambiguous");
  assert.equal(parseCgmExport("Device Timestamp,Record Type,Historic Glucose mmol/L\n01-02-2026 08:00,0,6.0", "UTC", "mdy").rows[0]!.at, "2026-01-02T08:00:00.000Z");

  // Generic, with offsets; no unit anywhere -> rows rejected with a reason; unknown time zone refused.
  const gen = parseCgmExport("timestamp,glucose,unit\n2026-10-10T08:00:00+05:30,110,mg/dL\n2026-10-10T08:05:00+05:30,,mg/dL", "UTC");
  assert.ok(gen.ok && gen.rows.length === 1 && gen.rows[0]!.at === "2026-10-10T02:30:00.000Z" && gen.rows[0]!.mmol === 6.1);
  assert.equal(parseCgmExport("timestamp,glucose\n2026-10-10T08:00:00Z,6", "UTC").rejected.length, 1);
  assert.equal(parseCgmExport("a,b\n1,2", "UTC").ok, false);
  assert.match(parseCgmExport("timestamp,glucose mmol/L\n2026-10-10T08:00:00Z,6", "Mars/Base").problem!, /time zone/);
}

async function db() {
  if (!isPostgresConfigured()) return console.log("cgm: pure checks PASS; DB part skipped (no DATABASE_URL)");
  assertSeedingAllowed("cgm-test");
  await assertNotProductionDatabase(getPgPool(), "cgm-test");
  const tag = randomUUID().slice(0, 6);
  const mk = async (label: string) => {
    const id = randomUUID();
    await getPgPool().query(`INSERT INTO aksh.users (id, email, password_hash) VALUES ($1, $2, 'not-a-login')`, [id, `cgm-${label}-${id.slice(0, 8)}@akshhealth.test`]);
    return id;
  };
  const nurseId = await mk("nurse");
  const org = await createOrganisation({ userId: nurseId, email: `n-${tag}@akshhealth.test`, displayName: "Nurse", role: "nurse" }, { name: `CGM Clinic ${tag}`, kind: "diabetes_centre" });
  let staff = await loadNetworkContext(nurseId, "nurse");
  const [p1, p2] = (await importPatients(staff, org.id, { patients: [
    { recordRef: `CG-1-${tag}`, givenName: "Tara", familyName: "One", dateOfBirth: "1990-01-01", diabetesType: "type_1" },
    { recordRef: `CG-2-${tag}`, givenName: "Uma", familyName: "Two", dateOfBirth: "1991-01-01", diabetesType: "type_1" },
  ] } as never)) as unknown as { id: string }[];

  // No time zone yet: refused rather than guessed.
  await assert.rejects(previewUpload(staff, p1!.id, dexcomFixture()), /time zone/);
  await updateOrganisation(staff, org.id, { locale: { timezone: "Europe/London" } });
  staff = await loadNetworkContext(nurseId, "nurse");

  // Clinic upload: preview writes nothing; commit stores readings once; device summaries count clinically.
  const csv = dexcomFixture();
  const preview = await previewUpload(staff, p1!.id, csv);
  assert.equal(preview.readings, 14 * 288);
  assert.equal(preview.alreadyStored, 0);
  const first = await commitUpload(staff, p1!.id, csv, undefined, "clarity.csv");
  assert.equal(first.accepted, 14 * 288);
  assert.ok(first.summarised);
  const again = await commitUpload(staff, p1!.id, csv, undefined, "clarity.csv");
  assert.equal(again.accepted, 0);
  assert.equal(again.duplicate, 14 * 288, "overlapping exports never double count");
  const detail = await getPatientDetail(staff, p1!.id);
  assert.ok(detail!.cgm && Math.abs(detail!.cgm.timeInRangePct - 70) < 0.3, "clinic CGM summary feeds the record");
  const view = await getCgm(staff, p1!.id);
  assert.equal(view.agp.length, 24);
  assert.ok(view.metrics!.sufficient);

  // Patient upload: stored, but its summary does not count until a clinician checks it.
  const patientUser = await mk("patient");
  await acceptPatientInvite({ userId: patientUser }, { code: (await createInvite(staff, org.id, { kind: "patient", patientId: p2!.id })).code, dateOfBirth: "1991-01-01" });
  const pctx = await loadNetworkContext(patientUser, "patient");
  await assert.rejects(commitUpload(pctx, p1!.id, csv, undefined), /not found/i, "a patient cannot upload to another record");
  const own = await commitUpload(pctx, p2!.id, csv, undefined, "mine.csv");
  assert.ok(own.summarised);
  assert.equal((await getPatientDetail(staff, p2!.id))!.cgm, null, "patient-uploaded summary waits for a clinician");
  const staffView = await getCgm(staff, p2!.id);
  assert.equal(staffView.uncheckedSummaryIds.length, 9);
  console.log("cgm: parsing, time zones, ambiguity, metrics, AGP, preview, idempotent upload, clinic vs patient provenance — PASS");
}

async function run() {
  pure();
  await db();
}

run()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => closePgPool());
