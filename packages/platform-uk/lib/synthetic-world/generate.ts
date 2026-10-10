import { riskBandForScore } from "@/lib/mock-data/risk-band";

import { CGM_DEVICES, MARKETS, MEDS, NAMES, ORG_NAME_PARTS, REGISTRATION_PREFIX, ROLE_LABEL, ROLE_MIX } from "./catalog";
import type {
  CgmSummary,
  DiabetesType,
  LabPoint,
  MarketCode,
  Medication,
  Organisation,
  PlatformRole,
  Professional,
  ProfessionalRole,
  SyntheticWorld,
  WorldPatient,
} from "./types";

/** Fixed anchor so the world is identical on every machine and in every test. */
export const WORLD_ANCHOR = "2026-10-10";
export const WORLD_SEED = 20261010;
export const SYNTHETIC_EMAIL_DOMAIN = "aksh-synthetic.example";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;
const pick = <T,>(r: Rng, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
const between = (r: Rng, lo: number, hi: number) => lo + r() * (hi - lo);
const int = (r: Rng, lo: number, hi: number) => Math.floor(between(r, lo, hi + 1));
const chance = (r: Rng, p: number) => r() < p;
const round1 = (n: number) => Math.round(n * 10) / 10;

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

export const mmolToPercent = (mmol: number) => round1(mmol / 10.929 + 2.15);

const PATIENTS_PER_MARKET: Record<MarketCode, number> = { GB: 150, IN: 160, US: 110, AE: 80 };
const PRO_SHARE: Record<MarketCode, number> = { GB: 0.35, IN: 0.3, US: 0.2, AE: 0.15 };

function syntheticPhone(market: MarketCode, n: number) {
  switch (market) {
    case "GB":
      return `07700 900${String(n % 1000).padStart(3, "0")}`; // Ofcom drama range
    case "US":
      return `(212) 555-01${String(n % 100).padStart(2, "0")}`; // fictional 555-0100–0199 range
    case "IN":
      return `+91 00000 ${String(n % 100000).padStart(5, "0")}`; // invalid prefix by design
    case "AE":
      return `+971 00 000 ${String(n % 10000).padStart(4, "0")}`; // invalid prefix by design
  }
}

function buildOrganisations(r: Rng): Organisation[] {
  const orgs: Organisation[] = [];
  let n = 0;
  const add = (o: Omit<Organisation, "id" | "email">) => {
    n += 1;
    const id = `ORG-${o.market}-${String(n).padStart(3, "0")}`;
    orgs.push({ ...o, id, email: `contact@${slug(o.name)}.${SYNTHETIC_EMAIL_DOMAIN}` });
  };
  for (const m of MARKETS) {
    const cities = NAMES[m.code].cities;
    for (let i = 0; i < 3; i++) {
      const name = `${pick(r, ORG_NAME_PARTS.clinic)} ${m.code === "US" ? "Family Medicine" : m.code === "IN" ? "Diabetes & Family Clinic" : "Family Practice"}`;
      add({ kind: "primary_care_clinic", name: `${name} (${cities[i]})`, market: m.code, city: cities[i]!, servicesOffered: ["Diabetes reviews", "Blood tests", "Foot checks", "Nurse clinics"] });
    }
    add({ kind: "diabetes_centre", name: `${cities[3]} Diabetes & Endocrine Centre`, market: m.code, city: cities[3]!, servicesOffered: ["Endocrinology", "Insulin pump & CGM clinic", "Structured education", "Antenatal diabetes"] });
    add({ kind: "hospital", name: `${cities[4]} General Hospital`, market: m.code, city: cities[4]!, servicesOffered: ["Inpatient diabetes", "Renal", "Cardiology", "Ophthalmology"] });
    for (let i = 0; i < 5; i++) {
      add({ kind: "community_pharmacy", name: `${pick(r, ORG_NAME_PARTS.pharmacy)} Pharmacy ${cities[i % cities.length]} ${i + 1}`, market: m.code, city: cities[i % cities.length]!, servicesOffered: ["Dispensing", "Medicine reviews", "BP checks", m.code === "GB" ? "Repeat prescriptions" : "Home delivery"] });
    }
    add({ kind: "laboratory", name: `${pick(r, ORG_NAME_PARTS.lab)} Diagnostics ${cities[0]}`, market: m.code, city: cities[0]!, servicesOffered: ["HbA1c", "Renal profile", "Lipids", "Urine ACR"] });
  }
  const payers: [MarketCode, string][] = [
    ["GB", "Public health service commissioner (synthetic)"],
    ["GB", ORG_NAME_PARTS.payer[0]!],
    ["IN", ORG_NAME_PARTS.payer[2]!],
    ["IN", "State health assurance scheme (synthetic)"],
    ["US", ORG_NAME_PARTS.payer[1]!],
    ["US", ORG_NAME_PARTS.payer[4]!],
    ["AE", ORG_NAME_PARTS.payer[3]!],
    ["AE", ORG_NAME_PARTS.payer[5]!],
  ];
  for (const [market, name] of payers) add({ kind: "payer", name, market, city: NAMES[market].cities[0]!, servicesOffered: ["Coverage", "Care management", "Outcome-based contracts"] });
  add({ kind: "research_institute", name: "Northern Institute for Diabetes Research (synthetic)", market: "GB", city: "Manchester", servicesOffered: ["Federated evaluation", "Ethics-approved studies"] });
  add({ kind: "research_institute", name: "Deccan Metabolic Research Foundation (synthetic)", market: "IN", city: "Hyderabad", servicesOffered: ["Population studies", "Trial recruitment"] });
  CGM_DEVICES.forEach((d, i) =>
    add({ kind: "device_partner", name: d.replace(" (synthetic)", " Devices (synthetic)"), market: (["GB", "US", "IN"] as MarketCode[])[i]!, city: "—", servicesOffered: ["CGM data feed", "Device onboarding"] })
  );
  return orgs;
}

const PLATFORM_ROLE: Record<ProfessionalRole, PlatformRole> = {
  family_physician: "gp",
  endocrinologist: "gp",
  eye_specialist: "gp",
  nephrologist: "gp",
  cardiologist: "gp",
  psychologist: "gp",
  diabetes_specialist_nurse: "nurse",
  diabetes_educator: "nurse",
  practice_nurse: "nurse",
  dietitian: "nurse",
  podiatrist: "nurse",
  care_coordinator: "nurse",
  clinical_pharmacist: "clinical-pharmacist",
  community_pharmacist: "clinical-pharmacist",
  practice_manager: "practice-manager",
};

const DOCTOR_ROLES = new Set<ProfessionalRole>(["family_physician", "endocrinologist", "eye_specialist", "nephrologist", "cardiologist"]);
const SPECIALIST_ROLES = new Set<ProfessionalRole>(["endocrinologist", "eye_specialist", "nephrologist", "cardiologist"]);

function buildProfessionals(r: Rng, orgs: Organisation[]): Professional[] {
  const out: Professional[] = [];
  const markets = MARKETS.map((m) => m.code);
  let n = 0;
  for (const [role, count] of ROLE_MIX) {
    for (let i = 0; i < count; i++) {
      // Deterministic spread across markets proportional to PRO_SHARE.
      const u = (i + 0.5) / count;
      let acc = 0;
      const market = markets.find((m) => (acc += PRO_SHARE[m]) >= u) ?? "GB";
      const sex = chance(r, 0.55) ? "female" : "male";
      const given = pick(r, NAMES[market][sex]);
      const family = pick(r, NAMES[market].family);
      const orgPool = orgs.filter((o) => o.market === market).filter((o) =>
        role === "community_pharmacist"
          ? o.kind === "community_pharmacy"
          : SPECIALIST_ROLES.has(role) || role === "psychologist"
            ? o.kind === "diabetes_centre" || o.kind === "hospital"
            : o.kind === "primary_care_clinic" || (role === "diabetes_specialist_nurse" && o.kind === "diabetes_centre")
      );
      n += 1;
      const id = `HCP-${String(n).padStart(3, "0")}`;
      out.push({
        id,
        title: DOCTOR_ROLES.has(role) ? "Dr" : sex === "female" ? "Ms" : "Mr",
        givenName: given,
        familyName: family,
        role,
        roleLabel: ROLE_LABEL[role],
        platformRole: PLATFORM_ROLE[role],
        organisationId: pick(r, orgPool).id,
        market,
        registration: `${REGISTRATION_PREFIX[market]}-${String(100000 + n * 7919).slice(-6)}`,
        email: `${slug(given)}.${slug(family)}.${n}@${SYNTHETIC_EMAIL_DOMAIN}`,
        languages: [...new Set(["English", pick(r, NAMES[market].languages)])],
        caseload: 0,
      });
    }
  }
  return out;
}

function diabetesTypeFor(r: Rng, sex: "female" | "male", age: number): DiabetesType {
  if (sex === "female" && age >= 22 && age <= 42 && chance(r, 0.18)) return "gestational";
  const x = r();
  if (age < 30) return x < 0.6 ? "type_1" : x < 0.75 ? "mody" : "type_2";
  return x < 0.74 ? "type_2" : x < 0.84 ? "prediabetes" : x < 0.93 ? "type_1" : "lada";
}

function hba1cSeries(r: Rng, type: DiabetesType): LabPoint[] {
  const base =
    type === "prediabetes"
      ? between(r, 42, 47)
      : type === "gestational"
        ? between(r, 38, 46)
        : type === "mody"
          ? between(r, 46, 58)
          : type === "type_1" || type === "lada"
            ? between(r, 50, 82)
            : pick(r, [between(r, 46, 53), between(r, 54, 63), between(r, 54, 63), between(r, 64, 90)]);
  const drift = between(r, -6, 7);
  return [-360, -270, -180, -90].map((offset, i) => {
    const mmol = Math.round(Math.max(36, Math.min(110, base + (drift * i) / 3 + between(r, -2.5, 2.5))));
    return { date: addDays(WORLD_ANCHOR, offset + int(r, -10, 10)), hba1cMmolMol: mmol, hba1cPercent: mmolToPercent(mmol) };
  });
}

function medsFor(r: Rng, type: DiabetesType, ctx: { latest: number; bmi: number; egfr: number; cvd: boolean; htn: boolean; uacr: number; age: number; market: MarketCode }): Medication[] {
  const since = () => addDays(WORLD_ANCHOR, -int(r, 60, 2200));
  const m: Medication[] = [];
  const add = (k: keyof typeof MEDS) => m.push({ ...MEDS[k], since: since() });
  switch (type) {
    case "type_1":
      add("basal");
      add("bolus");
      break;
    case "lada":
      if (ctx.egfr >= 30) add("metformin");
      add("basal");
      break;
    case "mody":
      add("su");
      break;
    case "gestational":
      if (chance(r, 0.5)) add("metformin");
      else if (ctx.latest > 44) add("basal");
      break;
    case "prediabetes":
      if (ctx.egfr >= 30 && chance(r, 0.3)) add("metformin");
      break;
    case "type_2":
      if (ctx.egfr >= 30) add("metformin");
      if (ctx.cvd || ctx.egfr < 60 || ctx.uacr > 3 || (ctx.latest > 58 && chance(r, 0.5))) add(chance(r, 0.5) ? "sglt2" : "dapagliflozin");
      if (ctx.bmi >= 30 && ctx.latest > 58 && chance(r, 0.6)) add(chance(r, 0.5) ? "glp1" : "dulaglutide");
      else if (ctx.latest > 58 && chance(r, 0.35)) add("dpp4");
      if (ctx.latest > 64 && chance(r, ctx.market === "IN" ? 0.6 : 0.3)) add("su");
      if (ctx.latest > 75 && chance(r, 0.45)) add("basal");
      break;
  }
  if (type !== "gestational" && ctx.age >= 40 && chance(r, 0.75)) add("statin");
  if (type !== "gestational" && (ctx.htn || ctx.uacr > 3)) add(chance(r, 0.6) ? "acei" : "arb");
  return m;
}

function cgmFor(r: Rng, type: DiabetesType, meds: Medication[], latest: number): CgmSummary | null {
  const onInsulin = meds.some((x) => /insulin/i.test(x.name));
  const p = type === "type_1" ? 0.85 : type === "lada" ? 0.6 : type === "gestational" ? 0.2 : onInsulin ? 0.4 : 0;
  if (!chance(r, p)) return null;
  const tir = Math.round(Math.max(25, Math.min(92, 118 - latest * 0.95 + between(r, -6, 6))));
  const tbr = Math.round(Math.max(0, between(r, type === "type_1" ? 1 : 0, type === "type_1" ? 9 : 4)));
  return {
    device: pick(r, CGM_DEVICES),
    timeInRangePct: tir,
    timeBelowRangePct: tbr,
    timeAboveRangePct: Math.max(0, 100 - tir - tbr),
    meanGlucoseMmolL: round1(latest * 0.12 + 2.4),
    wearPct: int(r, 62, 99),
    lastSync: addDays(WORLD_ANCHOR, -int(r, 0, 9)),
  };
}

function buildPatients(r: Rng, orgs: Organisation[], pros: Professional[]): WorldPatient[] {
  const out: WorldPatient[] = [];
  let n = 0;
  for (const m of MARKETS) {
    const clinics = orgs.filter((o) => o.market === m.code && o.kind === "primary_care_clinic");
    const pharmacies = orgs.filter((o) => o.market === m.code && o.kind === "community_pharmacy");
    const payers = orgs.filter((o) => o.market === m.code && o.kind === "payer");
    const prosIn = (role: ProfessionalRole, orgId?: string) => {
      const sameOrg = pros.filter((p) => p.role === role && p.market === m.code && (!orgId || p.organisationId === orgId));
      return sameOrg.length ? sameOrg : pros.filter((p) => p.role === role && p.market === m.code).length ? pros.filter((p) => p.role === role && p.market === m.code) : pros.filter((p) => p.role === role);
    };
    for (let i = 0; i < PATIENTS_PER_MARKET[m.code]; i++) {
      n += 1;
      const sex = chance(r, 0.5) ? "female" : "male";
      const age = Math.round(Math.max(14, Math.min(92, between(r, 18, 88) * 0.7 + between(r, 30, 75) * 0.3)));
      const type = diabetesTypeFor(r, sex, age);
      const given = pick(r, NAMES[m.code][sex]);
      const family = pick(r, NAMES[m.code].family);
      const dob = `${2026 - age}-${String(int(r, 1, 12)).padStart(2, "0")}-${String(int(r, 1, 28)).padStart(2, "0")}`;
      const hba1c = hba1cSeries(r, type);
      const latest = hba1c[hba1c.length - 1]!.hba1cMmolMol;
      const bmi = round1(m.code === "IN" ? between(r, 21, 34) : between(r, 22, 42));
      const htn = type !== "gestational" && age > 35 && chance(r, 0.55);
      const egfr = Math.round(age > 60 ? between(r, 25, 95) : between(r, 55, 115));
      const uacr = round1(chance(r, 0.25) ? between(r, 3.1, 40) : between(r, 0.3, 2.9));
      const cvd = age > 50 && chance(r, 0.18);
      const meds = medsFor(r, type, { latest, bmi, egfr, cvd, htn, uacr, age, market: m.code });
      const cgm = cgmFor(r, type, meds, latest);
      const retinopathy = type !== "prediabetes" && type !== "gestational" && chance(r, latest > 64 ? 0.22 : 0.07);
      const comorbidities = [
        htn ? "Hypertension" : null,
        egfr < 60 ? `Chronic kidney disease (eGFR ${egfr})` : null,
        cvd ? "Cardiovascular disease" : null,
        retinopathy ? "Diabetic retinopathy" : null,
        type !== "prediabetes" && chance(r, latest > 64 ? 0.22 : 0.08) ? "Peripheral neuropathy" : null,
        bmi >= 30 ? "Obesity" : null,
        chance(r, 0.1) ? "Depression" : null,
        chance(r, 0.14) ? "Fatty liver disease" : null,
        cvd && chance(r, 0.3) ? "Heart failure" : null,
      ].filter(Boolean) as string[];
      const footRisk = comorbidities.includes("Peripheral neuropathy") ? (chance(r, 0.4) ? "high" : "moderate") : chance(r, 0.15) ? "moderate" : "low";
      const onHypoRisk = meds.some((x) => /insulin|Gliclazide/.test(x.name));
      const hypoEvents90d = onHypoRisk ? int(r, 0, type === "type_1" ? 9 : 4) : 0;
      const lastEyeScreening = type === "prediabetes" ? null : addDays(WORLD_ANCHOR, -int(r, 30, 480));
      const sbp = Math.round(htn ? between(r, 128, 168) : between(r, 108, 138));
      const clinic = pick(r, clinics);

      const careTeam: WorldPatient["careTeam"] = [{ role: "family_physician", professionalId: pick(r, prosIn("family_physician", clinic.id)).id }];
      careTeam.push({ role: chance(r, 0.5) ? "practice_nurse" : "diabetes_educator", professionalId: pick(r, prosIn(chance(r, 0.5) ? "practice_nurse" : "diabetes_educator")).id });
      careTeam.push({ role: "community_pharmacist", professionalId: pick(r, prosIn("community_pharmacist")).id });
      if (type === "type_1" || type === "lada" || type === "gestational" || type === "mody" || latest > 75) {
        careTeam.push({ role: "endocrinologist", professionalId: pick(r, prosIn("endocrinologist")).id });
        careTeam.push({ role: "diabetes_specialist_nurse", professionalId: pick(r, prosIn("diabetes_specialist_nurse")).id });
      }
      if (bmi >= 30 || type === "gestational") careTeam.push({ role: "dietitian", professionalId: pick(r, prosIn("dietitian")).id });
      if (footRisk !== "low") careTeam.push({ role: "podiatrist", professionalId: pick(r, prosIn("podiatrist")).id });
      if (retinopathy) careTeam.push({ role: "eye_specialist", professionalId: pick(r, prosIn("eye_specialist")).id });
      if (egfr < 45) careTeam.push({ role: "nephrologist", professionalId: pick(r, prosIn("nephrologist")).id });
      if (comorbidities.includes("Depression")) careTeam.push({ role: "psychologist", professionalId: pick(r, prosIn("psychologist")).id });
      if (meds.length >= 4) careTeam.push({ role: "clinical_pharmacist", professionalId: pick(r, prosIn("clinical_pharmacist", clinic.id)).id });
      if (cvd || comorbidities.includes("Heart failure")) careTeam.push({ role: "cardiologist", professionalId: pick(r, prosIn("cardiologist")).id });

      // Risk: transparent additive rules (drivers are shown to clinicians).
      const drivers: string[] = [];
      let score = 15;
      const addDriver = (pts: number, why: string) => {
        score += pts;
        drivers.push(`${why} (+${pts})`);
      };
      if (latest >= 75) addDriver(30, `HbA1c ${latest} mmol/mol`);
      else if (latest >= 64) addDriver(20, `HbA1c ${latest} mmol/mol`);
      else if (latest >= 58) addDriver(10, `HbA1c ${latest} mmol/mol`);
      if (hypoEvents90d >= 3) addDriver(18, `${hypoEvents90d} hypos in 90 days`);
      if (egfr < 45) addDriver(16, `eGFR ${egfr}`);
      else if (egfr < 60) addDriver(8, `eGFR ${egfr}`);
      if (cvd) addDriver(14, "Cardiovascular disease");
      if (comorbidities.includes("Heart failure")) addDriver(10, "Heart failure");
      if (retinopathy) addDriver(6, "Retinopathy");
      if (footRisk === "high") addDriver(10, "High foot risk");
      if (age >= 75) addDriver(8, `Age ${age}`);
      if (sbp >= 150) addDriver(6, `BP ${sbp} systolic`);
      if (uacr > 3) addDriver(6, `Urine ACR ${uacr}`);
      if (type === "type_1") addDriver(4, "Type 1 diabetes");
      score = Math.min(98, score);
      if (score >= 56 || hypoEvents90d >= 3) careTeam.push({ role: "care_coordinator", professionalId: pick(r, prosIn("care_coordinator")).id });

      const openCareGaps = [
        lastEyeScreening && lastEyeScreening < addDays(WORLD_ANCHOR, -365) ? "Eye screening overdue" : null,
        hba1c[hba1c.length - 1]!.date < addDays(WORLD_ANCHOR, -120) ? "HbA1c due" : null,
        type !== "gestational" && age >= 40 && !meds.some((x) => x.class === "Statin") ? "Statin not recorded" : null,
        footRisk === "high" ? "Annual foot check due" : null,
        type === "type_1" && !cgm ? "CGM not in use" : null,
        sbp >= 140 ? "Blood pressure above target" : null,
      ].filter(Boolean) as string[];

      const contactPreference = (
        { GB: ["sms", "phone", "app", "email"], IN: ["whatsapp", "whatsapp", "phone", "sms"], US: ["sms", "app", "phone", "email"], AE: ["whatsapp", "app", "phone"] } as const
      )[m.code];

      out.push({
        id: `W${String(n).padStart(4, "0")}`,
        marketId: `${m.code}-${String(400000 + n * 37).slice(-6)}`,
        title: age < 16 ? (sex === "female" ? "Miss" : "Master") : sex === "female" ? pick(r, ["Ms", "Mrs"]) : "Mr",
        givenName: given,
        familyName: family,
        sex,
        dob,
        age,
        market: m.code,
        city: clinic.city,
        language: pick(r, NAMES[m.code].languages),
        phone: syntheticPhone(m.code, n),
        contactPreference: pick(r, contactPreference),
        diabetesType: type,
        diagnosedYear: type === "gestational" ? 2026 : 2026 - int(r, 0, Math.max(1, Math.min(30, age - 10))),
        hba1c,
        medications: meds,
        comorbidities,
        bmi,
        bloodPressure: { systolic: sbp, diastolic: Math.round(sbp * 0.6 + between(r, -4, 8)) },
        egfr,
        uacr,
        ldl: round1(between(r, 1.4, 4.6)),
        lastEyeScreening,
        footRisk,
        hypoEvents90d,
        cgm,
        careTeam,
        primaryOrganisationId: clinic.id,
        pharmacyId: pick(r, pharmacies).id,
        payerId: pick(r, payers).id,
        appUser: chance(r, m.code === "US" || m.code === "AE" ? 0.6 : 0.45),
        risk: { score, band: riskBandForScore(score), drivers },
        openCareGaps,
        nextAppointment: chance(r, 0.7) ? addDays(WORLD_ANCHOR, int(r, 1, 60)) : null,
      });
    }
  }
  return out;
}

let cached: SyntheticWorld | null = null;

export function getSyntheticWorld(): SyntheticWorld {
  if (cached) return cached;
  const r = mulberry32(WORLD_SEED);
  const organisations = buildOrganisations(r);
  const professionals = buildProfessionals(r, organisations);
  const patients = buildPatients(r, organisations, professionals);
  for (const p of patients) for (const t of p.careTeam) {
    const pro = professionals.find((x) => x.id === t.professionalId);
    if (pro) pro.caseload += 1;
  }
  cached = {
    seed: WORLD_SEED,
    generatedFor: WORLD_ANCHOR,
    markets: MARKETS,
    organisations,
    professionals,
    patients,
    honesty: { synthetic: true, realPatientData: false, realOrganisations: false },
  };
  return cached;
}
