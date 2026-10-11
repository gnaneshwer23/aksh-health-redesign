/**
 * CGM metrics following the international consensus on time in range (Battelino et al., Diabetes Care 2019) and the
 * glucose management indicator (Bergenstal et al., 2018). Pure.
 *
 * Ranges (mmol/L): very low < 3.0, low 3.0–3.8, in range 3.9–10.0, high 10.1–13.9, very high > 13.9.
 * General targets for most adults with type 1 or type 2 diabetes: TIR > 70%, TBR < 4%, < 3.0 below 1%,
 * TAR < 25%, > 13.9 below 5%, CV ≤ 36%. Data are sufficient with ≥ 14 days and ≥ 70% sensor wear.
 * Targets differ for older or high-risk people and in pregnancy; the clinician decides which apply.
 */
export type CgmPoint = { at: string; mmol: number };

export type CgmMetrics = {
  from: string;
  to: string;
  days: number;
  readings: number;
  intervalMin: number;
  wearPct: number;
  sufficient: boolean;
  meanMmol: number;
  sdMmol: number;
  cvPct: number;
  gmiPct: number;
  gmiMmolMol: number;
  pct: { veryLow: number; low: number; inRange: number; high: number; veryHigh: number };
  /** Below-target flags against the general adult targets; for the clinician, not a diagnosis. */
  flags: string[];
};

const round1 = (x: number) => Math.round(x * 10) / 10;

/** Typical sampling interval (median gap), so wear works for 5-minute and 15-minute sensors alike. */
export function samplingInterval(points: CgmPoint[]): number {
  const gaps: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const g = (Date.parse(points[i]!.at) - Date.parse(points[i - 1]!.at)) / 60_000;
    if (g > 0 && g <= 30) gaps.push(g);
  }
  if (!gaps.length) return 5;
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)]!;
  return median <= 7 ? 5 : median <= 20 ? 15 : Math.round(median);
}

/** Flags against the general adult consensus targets, worst first. Shared by the patient view and monitoring. */
export function consensusFlags(m: { veryLow: number; low: number; inRange: number; veryHigh: number; cvPct: number; days: number; wearPct: number; sufficient: boolean }) {
  const flags: string[] = [];
  if (m.veryLow >= 1) flags.push("time below 3.0 mmol/L is 1% or more");
  if (m.veryLow + m.low >= 4) flags.push("time below range is 4% or more");
  if (m.inRange < 70) flags.push("time in range is under 70%");
  if (m.veryHigh >= 5) flags.push("time above 13.9 mmol/L is 5% or more");
  if (m.cvPct > 36) flags.push("glucose variability (CV) is above 36%");
  if (!m.sufficient) flags.push(`not enough data for reliable metrics (${m.days} days, ${round1(m.wearPct)}% wear; needs 14 days and 70%)`);
  return flags;
}

/** Ranking for monitoring: lower is more urgent. Hypoglycaemia first, then hyperglycaemia, then data quality. */
export function urgency(m: { veryLow: number; low: number; inRange: number; veryHigh: number; sufficient: boolean; stale: boolean }) {
  if (m.veryLow >= 1) return 0;
  if (m.veryLow + m.low >= 4) return 1;
  if (m.stale) return 2;
  if (m.veryHigh >= 5 || m.inRange < 50) return 3;
  if (m.inRange < 70) return 4;
  if (!m.sufficient) return 5;
  return 6;
}

export function computeMetrics(all: CgmPoint[], windowDays = 14, now = Date.now()): CgmMetrics | null {
  const from = now - windowDays * 86_400_000;
  const points = all.filter((p) => {
    const t = Date.parse(p.at);
    return t > from && t <= now;
  });
  if (points.length < 2) return null;
  const n = points.length;
  const values = points.map((p) => p.mmol);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1));
  const count = (f: (v: number) => boolean) => (values.filter(f).length / n) * 100;
  const veryLow = count((v) => v < 3.0);
  const low = count((v) => v >= 3.0 && v < 3.9);
  const inRange = count((v) => v >= 3.9 && v <= 10.0);
  const veryHigh = count((v) => v > 13.9);
  const high = 100 - veryLow - low - inRange - veryHigh;
  const interval = samplingInterval(points);
  const firstT = Date.parse(points[0]!.at);
  const lastT = Date.parse(points[n - 1]!.at);
  const days = Math.max(1, Math.round((lastT - firstT) / 86_400_000));
  const expected = (windowDays * 24 * 60) / interval;
  const wear = Math.min(100, (n / expected) * 100);
  const meanMgdl = mean * 18.0182;
  const gmiPct = 3.31 + 0.02392 * meanMgdl;
  const gmiMmolMol = 12.71 + 4.70587 * mean;
  const sufficient = days >= 14 && wear >= 70;
  const flags = consensusFlags({ veryLow, low, inRange, veryHigh, cvPct: (sd / mean) * 100, days, wearPct: wear, sufficient });
  return {
    from: points[0]!.at,
    to: points[n - 1]!.at,
    days,
    readings: n,
    intervalMin: interval,
    wearPct: round1(wear),
    sufficient,
    meanMmol: round1(mean),
    sdMmol: round1(sd),
    cvPct: round1((sd / mean) * 100),
    gmiPct: round1(gmiPct),
    gmiMmolMol: Math.round(gmiMmolMol),
    pct: { veryLow: round1(veryLow), low: round1(low), inRange: round1(inRange), high: round1(high), veryHigh: round1(veryHigh) },
    flags,
  };
}

/** Ambulatory glucose profile: per hour of the local day, the 5th/25th/50th/75th/95th percentiles. */
export function agp(points: CgmPoint[], timeZone: string): { hour: number; p5: number; p25: number; p50: number; p75: number; p95: number; n: number }[] {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" });
  const byHour: number[][] = Array.from({ length: 24 }, () => []);
  for (const p of points) byHour[Number(fmt.format(new Date(p.at))) % 24]!.push(p.mmol);
  const q = (sorted: number[], f: number) => {
    const i = (sorted.length - 1) * f;
    const lo = Math.floor(i);
    return round1(sorted[lo]! + (sorted[Math.min(lo + 1, sorted.length - 1)]! - sorted[lo]!) * (i - lo));
  };
  return byHour.map((v, hour) => {
    if (!v.length) return { hour, p5: NaN, p25: NaN, p50: NaN, p75: NaN, p95: NaN, n: 0 };
    const s = [...v].sort((a, b) => a - b);
    return { hour, p5: q(s, 0.05), p25: q(s, 0.25), p50: q(s, 0.5), p75: q(s, 0.75), p95: q(s, 0.95), n: v.length };
  });
}
