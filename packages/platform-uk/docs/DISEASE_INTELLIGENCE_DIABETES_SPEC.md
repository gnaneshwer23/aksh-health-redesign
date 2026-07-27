# Disease Intelligence Spec: Diabetes (v0 draft)

**Status:** Spec only — no code implemented by this document.
**Date:** 27 July 2026
**Relationship to:** `docs/ADR_AKSH_INTELLIGENCE_PLATFORM_LAYER_MAP.md` (Layer 3 — Disease Intelligence Agents, marked **Missing**; also informs Layer 5 — Disease Digital Twins, also **Missing**)
**Companion doc (deferred):** Tech Stack Modernization ADR (C) — not needed to ship v1 of this spec; see note at the end.

---

## Purpose

Diabetes is the first Disease Intelligence module on the Aksh Intelligence Platform. This spec defines its scope, boundaries, and integration points so it can be built as **one module reusing existing platform primitives**, not as a parallel product with its own orchestrator, audit trail, or auth.

This is the layer the Layer Map ADR identified as the platform's only genuine "Missing" gap in the agent layer (Layer 3) and the entry point to a real Diabetes Twin later (Layer 5). Everything else the vision needs — orchestration, audit, consent, HITL, continuous learning — already exists and is reused here, not rebuilt.

## Relationship to the platform

- **Diabetes is a module, not a system.** It lives at `lib/disease-modules/diabetes/` (proposed, not yet created) and depends on existing platform primitives — it does not introduce a second CONDUCTOR, a second SHIELD, or a second consent store.
- **The 9 "intelligence areas" are feature/data modules, not 9 new LLM agents.** Each one is a typed scoring/derivation function (rules first, ML later under governance) that produces a structured signal. Signals feed into the *existing* HORIZON (risk) and GUARDIAN (safety) agents as additional inputs/contributing factors — they do not each need their own AI Gateway call, their own prompt, or their own infra.
- Where an area genuinely needs a draft-generation step (e.g., a nutrition talking-points draft), it follows the **existing coaching-draft pattern** (`lib/precision-health/coaching.ts`: `CoachingDraft` type, `hitlRequired: true`, `ehrWrite: false`, `isClinicalAdvice: false`) rather than inventing a new draft shape.

## Module boundary (proposed, not yet created)

```
lib/disease-modules/diabetes/
  types.ts              # DiabetesSignal, DiabetesModuleId, shared honesty fields
  glucose.ts             # Glucose Intelligence
  hba1c.ts                # HbA1c Intelligence
  insulin.ts               # Insulin Intelligence
  glp1.ts                   # GLP-1 Intelligence
  nutrition.ts               # Nutrition Scientist (coaching-draft pattern)
  exercise.ts                 # Exercise Physiologist (coaching-draft pattern)
  behaviour.ts                  # Behaviour Scientist (coaching-draft pattern)
  complications.ts                # Complication Intelligence
  prevention.ts                     # Prevention Intelligence
  index.ts               # barrel + composite DiabetesRiskContribution builder
```

This mirrors the existing `lib/precision-health/` structure (typed modules + a barrel `index.ts`) rather than introducing a new architectural pattern.

## The 9 areas: inputs, outputs, platform integration, HITL gates

Each area below follows the same honesty contract as existing precision-health modules: `hitlRequired: true`, `ehrWrite: false`, `autoRetrain: false`, and an explicit `isClinicalAdvice` or `physiologicalTwin` flag where relevant.

### 1. Glucose Intelligence

- **Inputs:** CGM/BGM readings (new `wearable`-adjacent modality — see Data Sources below), time-in-range (TIR) windows, pattern tags (dawn phenomenon, post-prandial spikes).
- **Outputs:** `GlucoseSignal { tirPercent, variabilityScore, patternFlags[], dataCompleteness }`.
- **Feeds:** HORIZON (as a new contributing-factor category alongside existing CVD/T2D factors) and GUARDIAN (hypoglycaemia-risk flag when patterns + insulin/GLP-1 status combine — see below).
- **HITL gate:** None on its own (observational signal); becomes gate-relevant only when it triggers a GUARDIAN alert.

### 2. HbA1c Intelligence

- **Inputs:** Lab HbA1c values over time (`lab` modality, `labSampleSchema` in `lib/precision-health/modalities.ts` already supports arbitrary `codeText`/`valueText` tests — HbA1c fits this schema today without a schema change).
- **Outputs:** `HbA1cSignal { latestValue, trend, predictedNext3Months, explanation[] }`. "Predict" here means a rules/regression estimate on trend, not a claimed clinical prediction — label explicitly as non-diagnostic.
- **Feeds:** HORIZON (T2D risk contributing factor), Prevention Intelligence (below).
- **HITL gate:** Clinician review before any HbA1c-driven care-plan change (reuses existing `medication_decision` or a case-level review, not a new gate type by default — see Open Questions).

### 3. Insulin Intelligence

- **Inputs:** Current insulin regimen (from `clinicalSampleSchema.medications`), glucose signal (#1), reported hypo events.
- **Outputs:** `InsulinSignal { regimenSummary, sensitivityEstimate, timingObservations[], hypoRiskFlag }`. **Dose modelling is explicitly advisory/explanatory only — this module never proposes an executable dose change.**
- **Feeds:** GUARDIAN (hypoglycaemia / dosing-conflict safety flag), HORIZON (contributing factor).
- **HITL gate:** **Mandatory, hard.** Any insulin-related output that could influence a dose must route through GUARDIAN's existing HITL-gated alert path. No silent or auto dose suggestion is ever surfaced to a patient; only to a clinician, as a draft, per existing GUARDIAN contract.

### 4. GLP-1 Intelligence

- **Inputs:** Current medication list, weight/BMI trend (if available), reported side effects (self-report via patient-companion surface).
- **Outputs:** `Glp1Signal { suitabilitySignal, responseTrend, sideEffectFlags[] }`. Suitability is a **structured talking point for clinician review**, not a prescribing recommendation.
- **Feeds:** GUARDIAN (side-effect / interaction flag), PATHWAY (referral trigger if specialist review indicated).
- **HITL gate:** Clinician review required before any GLP-1 initiation/change discussion is documented as a plan.

### 5. Nutrition Scientist

- **Inputs:** `lifestyleSampleSchema.dietNotes`, meal-pattern self-report.
- **Outputs:** Reuses `CoachingDraft` shape from `lib/precision-health/coaching.ts` (new `agentId: "NUTRITION_DIABETES"` variant or extend existing `NUTRITION` draft with diabetes-specific talking points — glycaemic load, protein timing).
- **Feeds:** Patient-companion coaching surface directly; informs HORIZON only as lifestyle context, not as a scored factor.
- **HITL gate:** Same as existing coaching pattern — `isClinicalAdvice: false`, escalation hints route to clinician for dietitian referral.

### 6. Exercise Physiologist

- **Inputs:** `wearableSampleSchema.steps`, `lifestyleSampleSchema.activityMinutesPerWeek`.
- **Outputs:** `CoachingDraft`-shaped (`agentId: "EXERCISE"`, already exists in `coaching.ts` — extend with diabetes-specific resistance/cardio talking points).
- **Feeds:** Patient-companion coaching surface; lifestyle context for HORIZON.
- **HITL gate:** Same as existing `EXERCISE` coaching draft.

### 7. Behaviour Scientist

- **Inputs:** Adherence signals (medication refill patterns if available), self-reported stress/motivation (patient-companion check-in).
- **Outputs:** `CoachingDraft`-shaped (`agentId: "MENTAL_HEALTH"` extension or a new `BEHAVIOUR` id), habit/adherence talking points.
- **Feeds:** Patient-companion coaching surface; PATHWAY if adherence risk suggests care-coordination follow-up.
- **HITL gate:** Same coaching pattern; any disclosed risk (e.g. diabetes distress, self-harm signals) escalates via existing clinical-escalation-hint mechanism to a human gate, never handled autonomously.

### 8. Complication Intelligence

- **Inputs:** Lab panels (eGFR/CKD via existing `labSampleSchema`), imaging metadata (`imagingMetaSampleSchema` — retinopathy screening result *metadata*, not image analysis), clinical conditions list (fatty liver, neuropathy flags if coded).
- **Outputs:** `ComplicationSignal { domain: "retinopathy" | "neuropathy" | "ckd" | "cardiovascular" | "fatty_liver", flagLevel, evidenceRefs[] }`.
- **Feeds:** HORIZON (as complication-risk contributing factors), PATHWAY (referral draft trigger, e.g. ophthalmology/renal referral).
- **HITL gate:** Any referral-triggering complication flag routes through the existing `referral_pathway` `HumanGateId` (`lib/types.ts`) — reuse, do not invent a new gate type here.

### 9. Prevention Intelligence

- **Inputs:** Composite of signals #1–8 plus population risk-state context (`lib/precision-health/risk-state.ts` `buildPopulationRiskState`).
- **Outputs:** `PreventionSignal { riskTrajectoryLabel, personalisedPriorities[], populationContext }`. This is the closest area to a "Diabetes Twin" but for v1 stays a **rules-based composite summary**, not a simulation — see Layer 5 note below.
- **Feeds:** HORIZON (top-level explanatory summary), patient-companion "my plan" surface (via existing `buildPersonalisedHealthPlanDraft` pattern in `lib/precision-health/health-plan.ts`).
- **HITL gate:** Any plan promotion requires HITL, exactly as `health-plan.ts` already enforces (`ehrWrite: false`, draft-only until clinician confirms).

## Composite integration: how 9 signals become one contribution to HORIZON/GUARDIAN

Rather than 9 separate agent calls, `lib/disease-modules/diabetes/index.ts` should expose one function — e.g. `buildDiabetesRiskContribution(patientId)` — that:

1. Derives signals #1, #2, #8, #9 (Glucose, HbA1c, Complications, Prevention) as **structured contributing factors** appended to HORIZON's existing `contributingFactors: string[]` / a new typed `diabetesFactors` field on `OracleDraft` (`lib/agents/llm-oracle.ts`).
2. Derives signals #3, #4 (Insulin, GLP-1) as **safety flags** appended to GUARDIAN's existing `interactions` / `safetyNotes` (`lib/agents/llm-guardian.ts`), not as a separate alert system.
3. Derives signals #5, #6, #7 (Nutrition, Exercise, Behaviour) as **coaching drafts** using the existing `CoachingDraft` type, surfaced on the patient-companion dashboard, not the clinician review queue (unless an escalation hint fires).

This keeps HORIZON and GUARDIAN as the single risk/safety surfaces clinicians already trust, rather than adding 9 new panels to the GP review queue.

## Non-goals for v1 (explicit)

- **No physiological digital twin.** Prevention Intelligence (#9) and any future "Diabetes Twin" stay rules/composite-based in v1, following the same honesty pattern as `lib/precision-health/twin-simulation.ts` (`physiologicalTwin: false` as a literal type field, not a comment).
- **No silent or automatic insulin/GLP-1 dose change.** Insulin and GLP-1 modules produce explanatory drafts only; no executable dosing action is ever generated without a human in the loop, and no dosing draft is ever auto-applied.
- **No live EMIS/SystmOne write.** All diabetes module outputs are drafts subject to the existing `liveEmis: false` guard; nothing in this spec requests an exception.
- **No claim of clinical advice without a clinician.** Every coaching-pattern output (#5, #6, #7) carries `isClinicalAdvice: false` and explicit disclaimers, exactly as the existing `NUTRITION`/`SLEEP`/`EXERCISE`/`MENTAL_HEALTH` drafts do today.
- **No new certifications implied.** This module does not change the Track A/B (`docs/BUILT_VS_REMAINING_AUDIT.md`) demo/live split. It ships as synthetic-cohort, review-first — same boundary as the rest of the product.
- **No new orchestrator, audit system, or auth.** CONDUCTOR, SHIELD, and NextAuth/Neon remain the only instances of each.

## Data sources

**v1 (now):** Synthetic demo data only, extending the existing cohort fixtures (`data/seed/demo-cohort-patients.json`, `lib/mock-data/patients.ts`) with diabetes-relevant fields (HbA1c history, medication regimen detail, self-reported glucose patterns). No new external dependency required.

**Modality contract extension needed:** `lib/precision-health/modalities.ts` currently has no CGM/glucose field on `wearableSampleSchema` or a dedicated `glucose` modality. Before v1 signal derivation can consume structured glucose data, either:
- (a) extend `wearableSampleSchema` with optional CGM fields (`glucoseMgDl`, `timeInRangePercent`), or
- (b) add a new `glucose` modality to the `MODALITY_IDS` union.

This is a **schema addition, not a live integration** — same `provenance: { liveStream: false, realPatientData: false }` contract as every other modality today. Decision needed from clinical lead (see Open Questions).

**Future (Phase 2+, not this spec):** Real CGM device APIs (Dexcom/Abbott/Libre), FHIR-based lab feeds for HbA1c from a connected EHR, structured medication adherence data from pharmacy systems. Each would be a new `ingestion-stub`-pattern adapter (`buildIngestionStubResponse` in `modalities.ts`) behind a consent grant and an explicit `liveStream` flag flip — never silently enabled.

## Integration with CONDUCTOR and SHIELD

- **CONDUCTOR (`lib/clinical-spine/orchestrate.ts`):** The diabetes module does not need a new orchestration path. `buildDiabetesRiskContribution` is called as an additional data-gathering step feeding HORIZON/GUARDIAN inputs, in the same position existing Neo4j graph signals occupy today — before the deterministic safety-route step, not as a parallel pipeline.
- **SHIELD audit:** Every diabetes-module output that reaches a clinician (HORIZON contribution, GUARDIAN flag, referral trigger) is audited exactly like existing agent outputs — no new audit table, no new event schema. Coaching-only outputs (#5–#7) that never leave the patient-companion surface follow the same audit posture as existing `NUTRITION`/`SLEEP` coaching drafts today (audited on generation, not exempt).

## Outcomes → continuous learning (governed, not silent)

Diabetes-module outcomes plug into the **existing** governed loop — no new learning-event schema:

1. A diabetes signal (e.g. a GUARDIAN hypo-risk flag from Insulin Intelligence) is recorded via the existing `POST /api/learning/events` contract (`agentLabel: "GUARDIAN"`, `predictionSummary`, clinician `decision`).
2. Eventual outcomes (e.g. "hypo event occurred / did not occur at 30 days") link via the existing `POST /api/learning/events/[id]/outcome` eventual-outcome pattern (`docs/CONTINUOUS_LEARNING.md`).
3. Any proposal to change how a diabetes signal is derived (new weighting, a real ML model replacing a rule) is a `GovernedProposedAction: "propose_model_update"` and **requires G-ML-1/2/3 sign-off** (`lib/repositories/governed-evaluation-repository.ts`, `docs/GOVERNED_MODEL_RELEASE_SOP.md`) before it can go live. `autoRetrainTriggered` stays `false` unconditionally, exactly as it does today.

No diabetes-specific exception to this loop is proposed or needed.

## Phased delivery

### v0 — Stub types (no behaviour)

- Create `lib/disease-modules/diabetes/types.ts` with the 9 signal types above, all honesty fields (`hitlRequired`, `ehrWrite: false`, `autoRetrain: false`, `physiologicalTwin: false` where relevant) as literal types, not comments.
- Extend cohort fixtures with minimal diabetes fields (HbA1c, regimen) for at least one demo patient.
- No wiring into HORIZON/GUARDIAN yet. No UI changes.
- Exit criteria: types compile, one fixture patient has diabetes-shaped data, no runtime behaviour change anywhere else.

### v1 — Rules/demo signals

- Implement #1 (Glucose), #2 (HbA1c), #8 (Complications), #9 (Prevention) as deterministic rules over fixture data — same pattern as existing `buildPatientRiskState`.
- Implement #5, #6, #7 (Nutrition, Exercise, Behaviour) as `CoachingDraft`-pattern extensions, reusing `coaching.ts` conventions.
- Wire #1/#2/#8/#9 into HORIZON's contributing factors; wire relevant flags into GUARDIAN.
- Implement #3 (Insulin) and #4 (GLP-1) as explanatory-only signals feeding GUARDIAN, with **no dose-change output of any kind** at this phase.
- Exit criteria: `npm run test:clinical-proof`-style scenario tests cover at least one Diabetes HORIZON contribution and one GUARDIAN flag; SHIELD audit events confirmed for both; demo cohort shows a coherent diabetes narrative end-to-end.

### v2 — Models under governance

- Any statistical/ML model replacing a v1 rule (e.g. a real HbA1c trend predictor, a real hypo-risk classifier) ships only behind the full G-ML-1/2/3 gate sequence in `docs/GOVERNED_MODEL_RELEASE_SOP.md`.
- Real modality ingestion (CGM device data) considered only with a named clinical owner and a signed consent/DPIA path, matching the precedent in `docs/PRECISION_HEALTH_DELIVERY_ROADMAP.md` Phase 2.
- A real Diabetes Twin (Layer 5) — glucose trajectory simulation under interventions — is scoped as its own follow-on spec once v1 signals are live and trusted; it should reuse the existing `twin-simulation.ts` scenario-ranking pattern (`physiologicalTwin: false`, `hitlRequired: true`) rather than introducing a new simulation framework.

## Open questions / decisions needed from clinical lead

1. **Modality schema extension:** confirm whether CGM/glucose fields extend `wearableSampleSchema` or become a new `glucose` modality in `lib/precision-health/modalities.ts` (affects v1 data model).
2. **Human gate reuse vs. extension:** confirm whether Insulin/GLP-1 decisions route through the existing `medication_decision` `HumanGateId`, or whether a new gate type (e.g. `insulin_dose_confirmation`) is clinically warranted. Adding a new `HumanGateId` is a `lib/types.ts` change and should not be done without clinical sign-off.
3. **HbA1c "prediction" framing:** confirm acceptable UI language for a trend-based estimate so it cannot be read as a diagnostic prediction.
4. **Complication referral routing:** confirm which complication flags (retinopathy vs. CKD vs. cardiovascular) should trigger a PATHWAY referral draft automatically (still HITL-gated) vs. requiring clinician-initiated referral only.
5. **Coaching agent id scheme:** confirm whether diabetes-specific coaching extends the existing `NUTRITION`/`EXERCISE`/`MENTAL_HEALTH` `CoachingAgentId` union in place, or introduces diabetes-suffixed variants (e.g. `NUTRITION_DIABETES`) to keep general-wellness and disease-specific coaching content distinguishable in SHIELD audit and analytics.
6. **Behaviour Scientist escalation content:** confirm the specific self-report signals (diabetes distress screening tool, if any) that should trigger the clinical-escalation-hint path, since this touches mental-health safety-netting.

## Deferred: Tech Stack Modernization ADR (C)

Nothing in this spec requires new infrastructure. v0 and v1 run entirely on the existing stack (Next.js, Neon, Neo4j, AI Gateway, Zod). If v2 modelling work later surfaces a real need (e.g. feature-store-scale glucose time-series storage, or real-time CGM stream processing), that need should be evaluated in the Tech Stack Modernization ADR (C) against the concrete bottleneck at the time — not provisioned speculatively now.
