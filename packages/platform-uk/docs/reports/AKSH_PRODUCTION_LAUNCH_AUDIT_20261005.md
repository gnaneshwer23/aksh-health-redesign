# Aksh Health — End-to-End Production Launch Audit

**Audited:** 2026-10-05T14:58Z  
**Build:** `fd65076` · **Production deploy:** Ready (`dpl_4iMtNfD9F4fdUh9LVhtmrv9bhceg`)  
**URL:** https://akshhealth.com

## Verdict

| Launch target | Decision |
|---|---|
| **Synthetic diabetes demo / publication clinic** | **GO — CONDITIONAL** |
| **SIM-IG / SIM-EMR rehearsal (synthetic only)** | **Pass** — see [AKSH_SYNTHETIC_EHR_REHEARSAL.md](./AKSH_SYNTHETIC_EHR_REHEARSAL.md) |
| **Live patient PHI / DPIA (GOV-002)** | **NO-GO / Blocked** |
| **Live EMIS / SystmOne write-back** | **NO-GO / Blocked** |

Ready to launch as a **simulated diabetes care-coordination platform** with named clinician HITL, FHIR staging (`liveEmis:false`), simulated EMIS/SystmOne chart round-trip rehearsal, and honest “not a live EHR write” labelling.

**Not** ready to launch as live clinical software handling real patients or writing to EMIS/SystmOne.

## What passed end-to-end

- Public marketing surface (home, platform, security, contact, get-started, signup, signin, Patel demo) — HTTP 200; public smoke **9/9** after Diabetes care copy fix.
- Postgres **live** on `/api/health`.
- Auth gates: `/api/context/package`, `/api/models/registry`, `/api/chat/patient`, GraphRAG POST → **401** without session.
- Unauthenticated GP demo UI loads (by design: `publicDemoDashboardPrefixes`) but Ask Aksh is disabled and Clinical Intelligence Workspace shows **Unauthorized**; mutating APIs stay gated.
- Review queue shows drafts with Accept / Edit / Reject and `liveEmis:false`.
- Integration contract: `syntheticOnly: true`, `defaultMode: synthetic_proof`, blocked claims include live NHS/EHR, real patient data, autonomous decisioning.
- Security page retains MHRA / certification honesty language.
- Aksh 2.0 eval + clinical spine + Ask Aksh + RBAC suites PASS; master journey 33/40 (7 durable skipped); CI E2E success on `3fe26b1`.
- Master QA: **38 Pass · 9 Conditional · 1 Blocked (GOV-002) · 0 Fail**.

## Blockers for “true” clinical production

1. **GOV-002** — DPIA / IG incomplete for live patient-data production (**still Blocked**; synthetic EHR rehearsal does not clear this).
2. **Live EMR** — contract and product enforce `liveEmis:false`; no autonomous write-back (**still Blocked / partner**). Simulated EMIS/SystmOne chart is rehearsal-only.
3. **Neo4j** — configured but **mock** (Aura paused); GraphRAG falls back (acceptable for demo).

## Residual / accepted for demo launch

- Public GP / ICS / Hospital dashboards without login (synthetic fixtures only).
- Formal p95 load harness and rollback drill not re-run this session.
- Enterprise clinical IdP button disabled with honest placeholder copy.

## Must not claim at launch

Do not market as: live NHS/EHR integration · real patient data handling · production clinical software/AI · autonomous clinical decisioning · MHRA certified.

## Immediate hygiene shipped with this audit

- Updated `scripts/smoke-public-pages.mjs` and `scripts/smoke-walkthrough-path.mjs` to expect **Diabetes care** (was failing against production).
- Synthetic EHR rehearsal: high-fidelity P002 longitudinal + HITL→BRIDGE→simulated chart; Master Journey MJ-41; see `docs/reports/AKSH_SYNTHETIC_EHR_REHEARSAL.md`.
