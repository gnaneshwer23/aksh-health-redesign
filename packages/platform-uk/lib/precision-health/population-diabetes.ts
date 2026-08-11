import { patients } from "@/lib/mock-data/patients";
import {
  DIABETES_COMPLICATION_DOMAINS,
  buildComplicationSignal,
  getDiabetesFixtureBundle,
  getDiabetesFixtureCohortIds
} from "@/lib/disease-modules/diabetes";

import { MIN_POPULATION_CELL_SIZE, suppressSmallCell, type SuppressibleCell } from "./population-suppression";

/**
 * Diabetes population aggregate — B6 (docs/PHASED_BUILD_PLAN.md).
 *
 * This is the platform's one genuinely-computed Population Intelligence
 * number: real arithmetic (`Array.filter`/`.length`) over the platform's
 * ACTUAL ~100-patient synthetic cohort (`lib/mock-data/patients.ts`), not
 * the separately-authored, illustrative-scale `populationData` fixture
 * (47,832 patients, `lib/mock-data/population.ts`) shown elsewhere on the
 * ICS dashboard. Volume I Ch.10 `FR-POP-022` records that no diabetes
 * population segment existed in code before this; this module is a small,
 * honest Segment-stage step — NOT the full Segment→Predict→Recommend→
 * Monitor→Learn pipeline (`FR-POP-005` restates that pipeline is future
 * work; building it in full is explicitly out of B6's scope).
 *
 * No AI Gateway call, no LLM — a pure, synchronous, deterministic function,
 * matching the rest of `lib/disease-modules/diabetes/` (`FR-DIAB-014`).
 */

/** Isolated-unit-test-only fixture id — not a member of the actual 100-patient cohort; excluded from population math. */
const ISOLATED_TEST_ONLY_PATIENT_ID = "DEMO-DIABETES-P1";

export type DiabetesPopulationAggregate = {
  artifactType: "aksh-diabetes-population-aggregate";
  /** Restates FR-POP-002: every Population Intelligence output names which pipeline stage produced it. */
  stage: "segment";
  cohortSource: "demo-cohort-100-patient";
  computedFrom: "live-arithmetic-over-actual-synthetic-cohort";
  totalPatients: number;
  diabetesFlagged: SuppressibleCell;
  /** Null when `diabetesFlagged` itself is suppressed — a suppressed count must never be reverse-derivable from a displayed percentage (FR-POP-032). */
  prevalencePercent: number | null;
  /** Of the diabetes-flagged patients, how many currently carry real B3 signal-builder fixture data (most of the extended synthetic cohort do not yet). */
  fixturedSignalPatients: SuppressibleCell;
  /** Of the fixtured patients, how many have at least one non-"none" complication-domain flag. */
  complicationSignalPatients: SuppressibleCell;
  minCellSize: number;
  limitations: string[];
  hitlRequired: true;
  ehrWrite: false;
  autoRetrain: false;
  generatedAt: string;
};

export function buildDiabetesPopulationAggregate(): DiabetesPopulationAggregate {
  const totalPatients = patients.length;
  const diabetesFlaggedPatients = patients.filter((p) => p.clinicalProfiles?.includes("t2d"));

  const fixturedIds = new Set(
    getDiabetesFixtureCohortIds().filter((id) => id !== ISOLATED_TEST_ONLY_PATIENT_ID)
  );
  const fixturedFlaggedPatients = diabetesFlaggedPatients.filter((p) => fixturedIds.has(p.id));

  const complicationFlaggedCount = fixturedFlaggedPatients.filter((p) => {
    const bundle = getDiabetesFixtureBundle(p.id);
    return DIABETES_COMPLICATION_DOMAINS.some((domain) => {
      const signal = buildComplicationSignal(
        { patientId: p.id, patientLabel: p.name },
        domain,
        bundle.complicationEvidence?.[domain] ?? []
      );
      return signal.flagLevel !== "none";
    });
  }).length;

  const diabetesFlagged = suppressSmallCell(diabetesFlaggedPatients.length);
  const fixturedSignalPatients = suppressSmallCell(fixturedFlaggedPatients.length);
  const complicationSignalPatients = suppressSmallCell(complicationFlaggedCount);

  return {
    artifactType: "aksh-diabetes-population-aggregate",
    stage: "segment",
    cohortSource: "demo-cohort-100-patient",
    computedFrom: "live-arithmetic-over-actual-synthetic-cohort",
    totalPatients,
    diabetesFlagged,
    prevalencePercent: diabetesFlagged.suppressed
      ? null
      : Math.round((diabetesFlaggedPatients.length / totalPatients) * 1000) / 10,
    fixturedSignalPatients,
    complicationSignalPatients,
    minCellSize: MIN_POPULATION_CELL_SIZE,
    limitations: [
      "This is a real, computed Segment-stage count over the platform's actual synthetic cohort — separate from the illustrative, hand-authored 47,832-patient fixture shown elsewhere on this dashboard (Volume I Ch.10 FR-POP-004/022).",
      "Complication-signal counts reflect only patients with B3 diabetes-module fixture data wired in today (a small subset) — most t2d-flagged patients in the extended synthetic cohort have no HbA1c/complications fixture yet, so they correctly contribute zero, not a hidden true value.",
      "The complication flag is a conservative evidence-count heuristic, not a clinically validated per-domain threshold (see lib/disease-modules/diabetes/complications.ts).",
      "This is a Segment-stage count only — no Predict/forecast, no recommendation, and no EHR write; HITL review required before any downstream clinical or operational action.",
      `Counts below ${MIN_POPULATION_CELL_SIZE} are suppressed as "fewer than ${MIN_POPULATION_CELL_SIZE}" (Volume I OQ-POP-1/OQ-ARC-2 conservative interim default — exact clinically/compliance-approved threshold is still open).`
    ],
    hitlRequired: true,
    ehrWrite: false,
    autoRetrain: false,
    generatedAt: new Date().toISOString()
  };
}
