/**
 * Risk drivers and care gaps derived from stored patient data. Transparent additive rules: every point is shown
 * to the clinician as a driver. Population summaries only — individual targets are a clinician's decision.
 */
import { riskBandForScore } from "@/lib/mock-data/risk-band";

export type DeriveInput = {
  asOf: Date;
  diabetesType: string | null;
  age: number;
  conditions: string[];
  footRisk: string | null;
  lastEyeScreening: string | null;
  latestHba1c: { value: number; observedAt: string } | null;
  egfr: number | null;
  uacr: number | null;
  systolicBp: number | null;
  hypos90d: number;
  usesCgm: boolean;
  onStatin: boolean;
};

export type RiskResult = { score: number; band: "Low" | "Medium" | "High" | "VeryHigh"; drivers: string[] };

export function deriveRisk(d: DeriveInput): RiskResult {
  const drivers: string[] = [];
  let score = 15;
  const add = (pts: number, why: string) => {
    score += pts;
    drivers.push(`${why} (+${pts})`);
  };
  const a1c = d.latestHba1c?.value ?? null;
  if (a1c !== null) {
    if (a1c >= 75) add(30, `HbA1c ${a1c} mmol/mol`);
    else if (a1c >= 64) add(20, `HbA1c ${a1c} mmol/mol`);
    else if (a1c >= 58) add(10, `HbA1c ${a1c} mmol/mol`);
  }
  if (d.hypos90d >= 3) add(18, `${d.hypos90d} hypos in 90 days`);
  if (d.egfr !== null) {
    if (d.egfr < 45) add(16, `eGFR ${d.egfr}`);
    else if (d.egfr < 60) add(8, `eGFR ${d.egfr}`);
  }
  if (d.conditions.includes("Cardiovascular disease")) add(14, "Cardiovascular disease");
  if (d.conditions.includes("Heart failure")) add(10, "Heart failure");
  if (d.conditions.some((c) => /retinopathy/i.test(c))) add(6, "Retinopathy");
  if (d.footRisk === "high") add(10, "High foot risk");
  if (d.age >= 75) add(8, `Age ${d.age}`);
  if (d.systolicBp !== null && d.systolicBp >= 150) add(6, `BP ${d.systolicBp} systolic`);
  if (d.uacr !== null && d.uacr > 3) add(6, `Urine ACR ${d.uacr}`);
  if (d.diabetesType === "type_1") add(4, "Type 1 diabetes");
  score = Math.min(98, score);
  return { score, band: riskBandForScore(score) as RiskResult["band"], drivers };
}

const daysAgo = (asOf: Date, days: number) => new Date(asOf.getTime() - days * 86_400_000).toISOString().slice(0, 10);

/** Missing data is listed as a gap rather than guessed (e.g. no HbA1c on record is "HbA1c due"). */
export function deriveCareGaps(d: DeriveInput): string[] {
  return [
    d.lastEyeScreening && d.lastEyeScreening < daysAgo(d.asOf, 365) ? "Eye screening overdue" : null,
    !d.latestHba1c || d.latestHba1c.observedAt.slice(0, 10) < daysAgo(d.asOf, 120) ? "HbA1c due" : null,
    d.diabetesType !== "gestational" && d.age >= 40 && !d.onStatin ? "Statin not recorded" : null,
    d.footRisk === "high" ? "Annual foot check due" : null,
    d.diabetesType === "type_1" && !d.usesCgm ? "CGM not in use" : null,
    d.systolicBp !== null && d.systolicBp >= 140 ? "Blood pressure above target" : null,
  ].filter(Boolean) as string[];
}

export function ageOn(dob: string, asOf: Date): number {
  const b = new Date(dob);
  let age = asOf.getUTCFullYear() - b.getUTCFullYear();
  const m = asOf.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && asOf.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}
