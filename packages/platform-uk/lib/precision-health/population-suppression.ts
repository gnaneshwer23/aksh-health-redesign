/**
 * Canonical minimum-cell-size (k-anonymity-style) suppression enforcement
 * point for Population Intelligence outputs.
 *
 * Volume I Ch.4 §4.10 (`OQ-ARC-2`) and Ch.10 §10.10 (`OQ-POP-1`, the same
 * open question restated at the population layer) both record that the
 * exact numeric threshold is NOT decided by engineering alone — it is owned
 * by Clinical Safety Lead + Compliance + Architecture (`FR-POP-031`). This
 * file does not decide that threshold. It exists so every population
 * aggregate on the platform has ONE enforcement point to call — instead of
 * zero, which was the state B6's audit found — while `OQ-POP-1`/`OQ-ARC-2`
 * remains open.
 *
 * `MIN_POPULATION_CELL_SIZE` is an engineering-chosen CONSERVATIVE INTERIM
 * DEFAULT, applying Volume I's own precautionary principle for undecided
 * safety/privacy-adjacent thresholds (`EC-POP-1`: "the more conservative
 * (higher-suppression) interpretation until OQ-POP-1 fixes the exact
 * rule"). It is not a clinically/compliance-approved final value, and
 * raising or lowering it is a reviewed, documented change — never a silent
 * runtime default (docs/PHASED_BUILD_PLAN.md B6).
 */
export const MIN_POPULATION_CELL_SIZE = 10;

export const POPULATION_SUPPRESSION_DISCLOSURE =
  `Cell counts below ${MIN_POPULATION_CELL_SIZE} are suppressed ("fewer than ${MIN_POPULATION_CELL_SIZE}") — an engineering-chosen conservative interim default (Volume I OQ-POP-1/OQ-ARC-2; the NHS-approved threshold is not yet clinically/compliance-decided).`;

export type SuppressibleCell = {
  /** The true exact count — always `null` once suppressed; never returned alongside `suppressed: true`. */
  value: number | null;
  suppressed: boolean;
  /** Safe-to-render string, e.g. "23" or "fewer than 10". */
  display: string;
};

/**
 * Applies the platform's single canonical small-cell suppression rule to a
 * population aggregate count before it is displayed or returned from an API.
 *
 * `FR-POP-031`/`AC-POP-031-1`: a segment whose true count is below the
 * threshold must never be reconstructable from the response — this function
 * is the one place that guarantee is implemented; callers must not
 * separately format or round a sub-threshold count themselves.
 */
export function suppressSmallCell(
  count: number,
  threshold: number = MIN_POPULATION_CELL_SIZE
): SuppressibleCell {
  if (!Number.isFinite(count) || count < threshold) {
    return { value: null, suppressed: true, display: `fewer than ${threshold}` };
  }
  return { value: count, suppressed: false, display: count.toLocaleString() };
}
