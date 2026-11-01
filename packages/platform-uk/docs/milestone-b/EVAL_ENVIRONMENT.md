# Milestone B — HCP evaluation environment

**Date:** 2026-10-31  
**Scope:** Engineering prep for **controlled synthetic** HCP sessions — **not** clinical deploy, **not** clinical validation.  
**Main tip at kickoff:** `83f2bfc` (post–Milestone A / PR #103).

---

## What this environment is

| Property | Value |
| --- | --- |
| Data | Synthetic demo / clinical-proof cohort only |
| EHR / EPS / PACS | Off (`ehrWrite: false`, `liveEmis: false`) |
| Lab / pharmacy | Simulation-labelled |
| RBAC production flip | Not changed (`productionRbacEnforced` untouched) |
| Clinical validation claim | **false** — always |

---

## Surfaces

| Surface | Path / command | Notes |
| --- | --- | --- |
| Case pack (fixtures) | `GET /api/eval/hcp-case-pack` · `lib/eval/hcp-case-pack.ts` · `npm run seed:hcp-eval-case-pack` | 8 synthetic session cases (hazard + core loop) |
| Clinician feedback | `POST /api/eval/hcp-feedback` | Accept/Edit/Reject + rubric 1–5 → scoped file store + SHIELD audit |
| Admin aggregates | `GET /api/eval/hcp-feedback` | Counts / means / hashed `pt_*` refs — no facilitator free-text |
| Golden agent eval | `npm run eval:agents` · `GET\|POST /api/eval/agents` | Deterministic CI path with `ENABLE_LLM_*=false` |
| Agent Ops | `/dashboard/admin/agent-ops` | Honesty + registry + durable runs + **eval harness panel** + loop funnel |
| Facilitator session UI (C1) | `/dashboard/gp/hcp-eval-session` · `/dashboard/admin/hcp-eval-session` | Case-pack picker + Accept/Edit/Reject + rubrics — see `docs/milestone-c/FACILITATOR_SESSION.md` |
| Loop funnel | `GET /api/agents/loop-outcomes` | Aggregates only (no COMPASS draft side-effect) |

Persistence for HCP feedback: `data/hcp-eval-feedback.json` or `data/hcp-eval-feedback.{scopeKey}.json` (append-only).

---

## Gate commands

From `packages/platform-uk`:

```bash
# Milestone B harness (hermetic file-store)
npm run test:milestone-b

# Documented A5 Neon path before shared-DB HCP sandbox (throwaway DATABASE_URL only)
MILESTONE_A5_USE_NEON=1 USE_POSTGRES=true npm run test:milestone-a5:neon

# Optional: re-seed case-pack JSON artifact
npm run seed:hcp-eval-case-pack
```

`test:milestone-b` includes case-pack + feedback smoke, Agent Ops wiring checks, golden `eval:agents` (LLM off), and typecheck.

---

## Honesty copy (required on ops surfaces)

- Simulation / synthetic validation — not a clinical device certification.
- Acceptance rate is a workflow metric, not a clinical accuracy score.
- Lab / pharmacy paths remain **simulation** unless live connectors are explicitly enabled.
- PRISM/ATLAS are scaffolds — never present as live CONDUCTOR actors.

---

## Residual blockers before real HCP calendar

See [SESSION_PROTOCOL.md](./SESSION_PROTOCOL.md) § Residual human blockers.

Engineering can ship this harness without booking GPs. Live HCP weeks still need: facilitator roster, CSO briefing, deterministic-vs-LLM week choice, throwaway Neon RLS gate green, and written decision to remain `in_validation`.
