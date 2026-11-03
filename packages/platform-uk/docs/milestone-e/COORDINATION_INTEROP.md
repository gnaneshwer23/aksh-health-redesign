# Milestone E — P1 Coordination / Interop

**Audience:** Platform / ops engineers.  
**Depends on:** E1 shared-run correlation (P0), D1 durable ops unify, C1–C3 facilitator / review / lab-pharmacy surfaces.  
**Companion:** [SHARED_RUN_CORRELATION.md](./SHARED_RUN_CORRELATION.md), [FACILITATOR_SESSION.md](../milestone-c/FACILITATOR_SESSION.md).

Synthetic / simulation honesty applies. Completing P1 does **not** flip `productionRbacEnforced`, certify clinical use, enable live EMIS/EPS/PACS, or expand PRISM/ATLAS.

---

## Scope

| Item | Detail |
| --- | --- |
| P1.1 Cross-surface handoff | HCP eval session → review-queue / lab-pharmacy links thread `careEpisodeId` **and** `patientId` (`careEpisodeId` + `care_episode_id` query keys). Review queue passes episode into `ClinicalOrchestratePanel` → orchestrate API. |
| P1.2 Loop-outcomes dual path | `GET /api/agents/loop-outcomes` (and readiness / COMPASS consumers) use Postgres-preferred `storeMode`: `postgres` \| `file` \| `file_fallback`. File-mode agent-run cases are visible — never silently emptied as `unavailable`. |
| P1.3 PATHWAY/BRIDGE lineage | Thin `durableRunId` / `correlationId` / `careEpisodeId` on PATHWAY drafts, ServiceRequest stubs, and BRIDGE staging bundles for ops join. PATHWAY/BRIDGE stay **outside** CONDUCTOR auto fan-out. `liveEmis: false`. |

### Click-path (P1.1)

1. Open HCP eval session with `?careEpisodeId=ce-…` (or enter id in the form).
2. Open **GP review queue** / **lab-pharmacy** links — both carry patient + episode.
3. On review queue, orchestrate posts `careEpisodeId` so durable claim shares the episode spine (E1).

### Click-path (P1.2)

1. Hermetic (no Neon / file adapter): Agent Ops funnel shows `storeMode: file` with any local agent-run cases.
2. Shared Neon + `USE_POSTGRES=true`: funnel shows `storeMode: postgres`.
3. PG list failure falls back to file with `storeMode: file_fallback`.

### Click-path (P1.3)

1. Orchestrate with durable claim → enqueue review case (`agentRun.durableRunId`).
2. Accept note+codes → PATHWAY referral metadata carries run lineage.
3. Case Accept → BRIDGE staging bundle embeds `akshRunLineage` · Agent Ops / bridge-staging status expose ids · `liveEmis:false`.

---

## Non-goals

- **Not** flipping `productionRbacEnforced`.
- **Not** live EMIS / EPS / PACS / e-RS write-back.
- **Not** expanding PRISM/ATLAS or bringing PATHWAY/BRIDGE into CONDUCTOR auto fan-out.
- **Not** autonomous Rx or EHR write.
- **Not** facilitator calendar / CSO exit-note UI / Neon booking helpers (P2).

---

## Definition of done

1. HCP → review / lab-pharmacy handoff helpers and pages thread `careEpisodeId` with patient id.
2. Loop-outcomes lists report honest `storeMode`; file sandboxes are not emptied.
3. PATHWAY drafts + BRIDGE Accept staging carry durable run / correlation / episode lineage for ops join.
4. `npm run test:milestone-e:p1` (and `test:milestone-e`) green; docs under `docs/milestone-e/`.
5. `productionRbacEnforced` remains false; `liveEmis` stays false.

---

## Gate commands

```bash
cd packages/platform-uk
npm run test:milestone-e:p1
npm run test:milestone-e
```

---

## Remaining after P1 (P2)

| Track | Residual |
| --- | --- |
| P2 / ops | Facilitator calendar; CSO exit-note UI; Neon booking helpers; broader PHI scrub; Workstream H SLOs; BRIDGE adapter contract tests (`liveEmis:false`); production RBAC staged flip |

---

## Honesty copy (required)

- Cross-surface handoffs keep episode + patient identity — not patient-only deep links.
- Loop-outcomes prefer Neon when the postgres review-case adapter is active; file is hermetic / fallback, never a silent empty.
- PATHWAY/BRIDGE lineage is ops correlation only — not live e-RS / EMIS (`liveEmis: false`).
- Simulation / synthetic validation — not a clinical device certification.
- HITL required · `ehrWrite: false` · no autonomous Rx / live EHR write.
