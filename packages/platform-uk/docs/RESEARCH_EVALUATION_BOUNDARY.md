# Research Evaluation Boundary

Aksh Health UK/EU can learn from PyHealth-style clinical AI tooling without turning the current product into a production ML system.

The current product remains a synthetic-data, review-first proof platform. Any ML or research evaluation work should sit outside the live reviewer workflow until clinical governance, data governance, safety ownership, and evaluation protocols are mature.

## What This Enables

- Define research datasets from synthetic review cases, simulated patients, benchmark outcomes, frozen evidence artifacts, and reviewer edit history.
- Define tasks such as draft extraction quality, safety-rule detection, missing-data detection, and reviewer-decision support calibration.
- Track metrics consistently instead of relying only on ad-hoc scenario checks.
- Prepare for future Python/offline evaluation services without changing the Next.js clinical review workflow.

## What This Does Not Claim

- No real patient data model training.
- No autonomous clinical decisioning.
- No production clinical AI safety claim.
- No live model deployment into the reviewer workflow.
- No NHS/EHR integration dependency.

## Recommended Architecture

Keep the boundary explicit:

`synthetic app data -> research dataset export -> offline task evaluation -> evidence artifact -> governance review`

Do not put experimental model predictions directly into clinician-facing decision flows. If a future model is evaluated, its outputs should first become offline evidence with dataset version, task definition, metric output, calibration result, and reviewer/governance interpretation.

## Initial Evaluation Tasks

- Structured draft extraction quality: measure field completeness, source-trace coverage, and reviewer correction rate.
- Safety and missing-data detection: measure scenario pass rate, blocker recall, warning precision, and false-ready rate.
- Reviewer decision support calibration: planned only; measure agreement, override explanation quality, and uncertainty calibration on synthetic data first.
- Clinical model training or fine-tuning: not allowed yet in this proof system.

## Near-Term Build Path

1. Keep `lib/research-evaluation-plan.ts` as the typed source of truth for this boundary.
2. Add a read-only JSON export only when the team needs a machine-readable research plan artifact.
3. Add offline evaluation fixtures only from synthetic cases.
4. Review any future model work through the governance pack before surfacing it in product UI.
