# Aksh Architecture Audit — C0 Snapshot (11 August 2026)

**Purpose:** A short, standalone snapshot of current codebase alignment against the frozen baseline (`docs/AKSH_FINAL_ARCHITECTURE_SPEC.md`), taken at the start of Build Tranche C (`docs/PHASED_BUILD_PLAN_C.md`), before any C-tranche code change. This is a **summary of** `docs/AKSH_ARCHITECTURE_GAP_ANALYSIS.md`'s own domain-by-domain findings, not a second independent analysis — where the two disagree, the gap analysis is authoritative and this document should be corrected to match it, not the other way round.

**Method:** Re-read of the gap analysis plus a direct check of the specific files it cites, confirming each verdict still holds as of this commit (no code changed between the gap analysis being written and this snapshot).

---

## Verdict summary — 7 domains + agent layer

| Domain | Verdict | Evidence |
|---|---|---|
| **1. Patient State** | **Missing** (as a first-class aggregate) | No `patient_state`-equivalent table in `lib/db/schema-sql.ts`/`db/migrations/*`. `ReviewCase` (`lib/types.ts`) is case/encounter-scoped, not patient-scoped, and carries a free-text `patientLabel`, not a required stable `patientId`. `lib/precision-health/timeline.ts` recomputes a longitudinal view per request — nothing persisted, nothing versioned. Patient identity *does* exist and is stable at the mock-data layer (`lib/mock-data/patients.ts`'s `id: "P001".."P100"`), but nothing versions facts about a patient over time. **C1 targets this.** |
| **2. Intelligence** | **Exists**, unclassified | `lib/agents/llm-*.ts` (SYNTHESIS, GUARDIAN, HORIZON/ORACLE, NEXUS, COMPASS/EQUITY, DrASSIST) provide LLM-backed judgment; `lib/disease-modules/diabetes/*` (9 signal builders) and `lib/precision-health/{risk-state,twin-simulation,population-diabetes}.ts` provide deterministic services — this split already matches the frozen spec's §12 principle in practice. What's missing is a code-level tag distinguishing the two inside `AGENT_DIRECTORY` itself. **C3 targets this.** |
| **3. Decision** | **Exists functionally, not separated** | `lib/clinical-spine/safety-route.ts` (route) + `lib/clinical-spine/queue-decision.ts` (priority) are both called from inside `lib/clinical-spine/orchestrate.ts` (CONDUCTOR) — Decision logic is reachable and correct today, but not independently named/importable as its own domain module, per spec §15's requirement that Decision be "architecturally separate from the Intelligence Layer." **C2 targets this.** |
| **4. Intervention** | **Exists**, fragmented shapes | `lib/precision-health/health-plan.ts`, `coaching.ts`, `lib/disease-modules/diabetes/{nutrition,exercise,behaviour}.ts`, PATHWAY referral packages, `lib/clinical-proof/ehr-writeback-sim.ts` are all correctly HITL-gated (`hitlRequired: true` literals throughout) and correctly never write live EHR (`ehrWrite: false` literals). No single `InterventionDraft` base type unifies them yet (parked to migration-plan P2-2, out of scope for this C-tranche). |
| **5. Learning** | **Strongest domain — near-complete match** | `lib/clinical-spine/outcomes-loop.ts` + `lib/repositories/learning-event-repository.ts` + `docs/GOVERNED_MODEL_RELEASE_SOP.md` already implement append-only outcome capture, the B2 two-ratio honesty split (`dispositionCompleteRatio` vs `realOutcomeCaptureRatio`), and hard-blocked governed evaluation (`assertGovernedEvaluationAllowed`). The one gap: diabetes coaching-draft Accepts don't yet call `recordLearningEvent` with a diabetes-labelled `agentLabel` — **C5 (P1-1) targets this**, gated on C1–C4. |
| **6. Data & Interoperability** | **Exists, scattered** | FHIR (`lib/clinical-proof/staged-fhir.ts` + migration 011), EMIS (`lib/emis-staging.ts`, hard `liveEmis:false`), Medplum (`lib/medplum-client.ts`, dry-run), Neo4j (`lib/neo4j/*`), and the modality connector registry (`lib/precision-health/connectors.ts`) each implement their own staged-vs-live pattern independently. `lib/integration-boundary-contract.ts` + `lib/integration-config.ts`'s `getIntegrationAdapterRegistry()` already enumerate every adapter with a `status`/`enabled` field — a good foundation — but there is no single formal `IntegrationAdapter` contract type unifying them. **C4 targets this**, as a thin additive wrapper over the existing registry (not a rewrite). |
| **7. Safety and Governance** | **Strong** | SHIELD (`lib/repositories/shield-audit-repository.ts`, hash-chained, fail-visible per B1), `lib/permission-matrix.ts` (deny-by-default `AppRole` since B1), HITL invariants (`lib/clinical-proof/hitl-invariants.ts`) are all enforced in types and tests, not just documentation. Known, honestly-labelled gap: `productionRbacEnforced: false` (parked to migration-plan P3-2, explicitly out of scope for Track A / this C-tranche). |
| **Agent layer** (cross-cutting, not itself one of the 7 domains) | **Exists, correctly kept, unclassified** | All 12 `AGENT_DIRECTORY` entries (`lib/agents.ts`) map cleanly onto the frozen architecture's Care-Orchestrator/Specialised-Agent stack per the gap analysis §2.1 Keep-as-agent table — **zero deletions are warranted or planned**. What's missing is the additive `kind`/`layer`/`keepStatus` classification. **C3 targets this.** |

---

## Hard-constraint spot-check (as of this commit, before any C-tranche code change)

| Constraint | Status | Evidence |
|---|---|---|
| `liveEmis: false` | ✅ Hard literal type | `lib/clinical-spine/orchestrate.ts` (`ClinicalSpineOrchestrateResult.liveEmis: false`); `canFlipLiveEmisInCode(): false` (`lib/clinical-spine/partner-readiness.ts`) |
| `autoRetrain: false` | ✅ Hard literal type | Same file; also `lib/clinical-proof/learning-loop.ts`'s `assertNoAutoRetrain` |
| HITL mandatory | ✅ Enforced | `hitlRequired: true` literal throughout `clinical-spine/*`, `disease-modules/diabetes/*`; `lib/clinical-proof/hitl-invariants.ts` |
| 12-agent directory, zero deletions | ✅ Intact | `lib/agents.ts` `AGENT_DIRECTORY` — 12 entries (CANVAS, SYNTHESIS, BRIDGE, NEXUS, GUARDIAN, PRISM, HORIZON, PATHWAY, COMPASS, ATLAS, SHIELD, CONDUCTOR) |
| Diabetes signals stay tools | ✅ Intact | `lib/disease-modules/diabetes/*` — 9 signal builders, none in `AGENT_DIRECTORY`, no AI Gateway import in any of them |

None of the C-tranche phases (C1–C5) touch any row in this table — each phase's own audit checklist re-confirms this individually.

---

## What "Exists" / "Partial" / "Missing" means in this document

- **Exists** — the domain's core mechanism is implemented, tested, and matches the frozen spec's principle, even if the file/module organisation doesn't yet carry the frozen spec's exact name.
- **Partial** — the domain has real, working functionality but is missing a specific, named component the frozen spec requires (e.g. Intervention exists but has no unified result type).
- **Missing** — no first-class implementation of the domain's core mechanism exists yet, even though adjacent/downstream consumers of it exist (e.g. Patient State: consumers like diabetes fixtures and `ReviewCase` exist, but the aggregate itself does not).

This snapshot will not be edited retroactively as C1–C5 land — each phase's own commit and plan checkbox is the record of what changed; a future C-tranche-closing summary (mirroring B7's own closing note) should compare against this file rather than rewrite it.
