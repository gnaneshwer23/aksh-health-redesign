# Aksh Health 1.0 — Current State Audit (from repository)

**Source pack:** `Aksh_Health_2.0_Next_Steps_Document_Pack` (Documents 00–10)  
**Evidence date:** 2026-10-05 (baseline) · **superseding classification:** 2026-10-30 — see [PHASE1_AGENT_ORCHESTRATION_CARE_EPISODE.md](./PHASE1_AGENT_ORCHESTRATION_CARE_EPISODE.md)  
**Codebase:** `packages/platform-uk` · production [akshhealth.com](https://akshhealth.com)  
**Rule honored:** facts from repo/deployment, not inferred capability.

> **Update (2026-10-30):** Context Engine V1 (`lib/context-engine`), model registry (`lib/model-registry`), Guardian gateway (`lib/guardian-gateway`), evaluation engine (`lib/evaluation-engine`), and GraphRAG (`lib/graphrag`) are implemented and wired on clinical-spine / diabetes agent-intel paths. Rows below that mark those as Missing are **stale**; use the Phase 1 report for current status. Care Episode canonical model added in migration `052_care_episodes.sql`.

This fills **Document 01**. Keep/Modify/Replace follows **Document 02** defaults against verified status.

---

## Architecture north star (Document 00) vs 1.0

| 2.0 layer | 1.0 today | Class |
|-----------|-----------|--------|
| Application (roles, HITL, dashboards) | Next.js 14, 8 role dashboards, Nightingale UI | **Working** |
| Context Engine | Patient State APIs + Ask Aksh bounded chart context + orchestrate payload — **not** a signed context package | **Partial** |
| Clinical Knowledge Graph + GraphRAG | Neo4j patient graph (prod often mock if Aura paused); no GraphRAG / guideline graph | **Partial / Missing** |
| Bounded agents + approved models | 12-agent directory + LLM agents; **no model registry** | **Partial** |
| Guardian safety gateway | GUARDIAN = DDI/allergy drafts; HITL Accept/Edit/Reject; not a hard PASS/REVIEW/BLOCK gateway over *all* agent output | **Partial** |
| Clinician review | GP review queue + case workspace | **Working** |
| Governed FHIR/EHR | BRIDGE staging, `liveEmis:false`, `simulated_ehr_v1` | **Working (simulated)** |
| Continuous evaluation + audit | SHIELD audit events; learning events `autoRetrain:false`; no evaluation engine / release gates | **Partial** |

---

## Audit domains (Document 01)

| Domain | Status | Evidence |
|--------|--------|----------|
| **Frontend** | Working | Routes: `/`, `/platform`, `/security`, `/contact`, `/get-started`, `/signup`, `/signin`, `/demo/patel`, `/dashboard/{gp,nurse,pharmacist,admin,patient,ics,hospital,researcher}` + nested GP/nurse/pharmacist pages. Components: `DashboardShell`, `HonestyStatusBar`, `AskAkshDrawer`, `AgentControlPanel`, `ReviewQueue`. |
| **Backend** | Working | Next.js App Router APIs: patients/state, chat/patient, agents, review-cases, consent, e2e, health, system contracts. Clinical spine: `lib/clinical-spine/orchestrate.ts`. |
| **Database** | Working | Neon Postgres (prod live). Patient State facts, consent grants, review cases, health plans, learning events, SHIELD. File JSON fallbacks for local/tests. |
| **AI/LLM** | Partial | Vercel AI Gateway / OpenAI-compatible chat. Agent LLM modules: `lib/agents/llm-{synthesis,guardian,oracle,nexus,equity,dr-assist}.ts`. **No immutable model registry, intended-use, or approval workflow.** |
| **Agents** | Partial | Directory `lib/agents.ts` AGENT_DIRECTORY (12). Live Phase 1: CANVAS, SYNTHESIS, BRIDGE, NEXUS, GUARDIAN, HORIZON (ORACLE), PATHWAY (REFERRAL), COMPASS (EQUITY), SHIELD, CONDUCTOR. Sub-caps: VOICE, Dr.Assist. **Not built:** PRISM, ATLAS (`live:false`). Contracts exist as code behaviour, not Document-06 JSON schemas with PASS/REVIEW/BLOCK on every output. |
| **FHIR/HL7** | Simulated | BRIDGE staging queue; Medplum rehearsal; `ehrWrite:false` / `liveEmis:false`. No live EMR write-back. |
| **Security** | Partial | NextAuth, role middleware, RBAC matrix, patient `boundPatientId` for demo patient01→P002. `productionRbacEnforced:false` in some e2e honesty. Resend email still sandbox until domain verified. |
| **Audit** | Partial | SHIELD AuditEvent on reviewer/consent actions. Missing Document-08 minimum fields consistently (model_version, context_version, tools_used, output_status PASS/REVIEW/BLOCK). |
| **Clinical workflow** | Working (sim clinic) | Capture → draft → HITL → staging → learning. Master Journey 35/35. Paired gp01/patient01 on P002. |
| **Deployment** | Working | Vercel production, GitHub Actions E2E (unit gates + Playwright). |

**Feature inventory (Working / Partial / Mock / Broken / Missing)**

| Feature | Class |
|---------|--------|
| Marketing + auth + 8 dashboards | Working |
| HITL review queue | Working |
| Diabetes Patient State + ingest | Working |
| Simulated lab/pharmacy/referral/appointments/CGM/VOICE | Working (simulated) |
| Ask Aksh patient chat (GP/nurse/pharmacist + bound patient) | Working |
| Neo4j graph | Mock when Aura paused; live when resumed |
| Context Engine V1 (signed package) | Missing |
| Knowledge Graph ontology + GraphRAG | Missing |
| Model Registry + Evaluation Engine | Missing |
| Guardian as hard gateway | Partial (DDI agent + HITL, not policy gateway) |
| Clinical Intelligence Workspace (evidence/uncertainty/graph pane) | Partial (queue + patient view; not Document-09 layout) |
| Live EMR / EPS / lab / mic | Missing (deferred) |

---

## Keep / Modify / Replace (Document 02 applied)

| Capability | Pack default | Repo decision | Why |
|------------|--------------|---------------|-----|
| Patient management | KEEP | **KEEP** | P002 identity, state APIs, dashboards |
| Authentication/RBAC | KEEP + HARDEN | **KEEP + HARDEN** | Bind practice invites; enforce prod RBAC; Resend domain |
| Clinical documentation | KEEP + MODIFY | **KEEP + MODIFY** | SYNTHESIS + HITL work; inject context package + provenance |
| Existing agents | KEEP + CONTRACT | **KEEP + CONTRACT** | Do not rename/rebuild 12-agent set; add Document-06 contracts |
| AI orchestration | MODIFY | **MODIFY** | CONDUCTOR/spine exists; add retries, context version, observability |
| FHIR/HL7 | KEEP + HARDEN | **KEEP + HARDEN** | Staging stays; no live write |
| Knowledge retrieval | MODIFY | **MODIFY / NEW** | Ask Aksh is chart-grounded LLM, not GraphRAG |
| Knowledge Graph | NEW | **NEW** (extend Neo4j when live) | Need ontology + provenance, not only patient nodes |
| GraphRAG | NEW | **NEW** | Not built |
| Model registry | NEW | **NEW** | Not built |
| Evaluation engine | NEW | **NEW** | Tests exist; not a release-gate engine |
| Guardian | STRENGTHEN | **STRENGTHEN** | Split DDI agent vs safety gateway |
| Clinician workspace | MODIFY | **MODIFY** | Add evidence, uncertainty, relationship view |

**Do not replace:** Next.js app, HITL loop, Patient State, BRIDGE staging, agent names, diabetes module, demo credentials, honesty banners.

---

## Day 30 gate (Document 10)

Pack says: **no major 2.0 build until audit + architecture approved.**

This document is the filled audit. Target architecture (Documents 03–09) is already specified in the pack. First narrow use case already selected: **diabetes / cardiometabolic decision support on synthetic P002**.

**Proposed first build (Days 31–60) once you approve:**

1. Context Engine V1 wrapping existing Patient State + permissions  
2. Knowledge Graph V1 on Neo4j (resume Aura) using Document-05 ontology  
3. Hybrid retrieval prototype for one agent (Dr.Assist or NEXUS)  
4. Agent contract JSON + PASS/REVIEW/BLOCK on that agent  
5. Guardian gateway in front of HITL (not replacing GUARDIAN DDI)  
6. Provenance fields on SHIELD events  

---

## Alignment notes

- Pack first use case = cardiometabolic/diabetes — **matches** current product (not NHS-primary).
- Pack forbids autonomous prescribing / unrestricted EHR write — **already true** (`liveEmis:false`, HITL).
- Pack GraphRAG is infrastructure, not a new agent — **do not add a GraphRAG agent to AGENT_DIRECTORY**.
- VOICE/Dr.Assist remain sub-capabilities in 1.0 — keep that classification.

## Remaining operator items (not 2.0 architecture)

- Resume Neo4j Aura `cbed9e8d` if graph V1 is in the 30–60 window  
- Verify Resend domain for external email  
- Clinical validation still UNVALIDATED — pack Day 90 still requires protocol, not live care  
