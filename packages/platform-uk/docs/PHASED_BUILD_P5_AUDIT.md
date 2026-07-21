# P5 Audit — Staging hardening: Medplum + Deepgram (secrets-gated)

**Date:** 2026-07-21  
**Branch:** `main`  
**Scope:** Optional live **staging** rehearsal for FHIR (Medplum) and ASR (Deepgram). Still not Layer 15 EHR. `liveEmis:false` hard.

## Exit criteria — PASS (degraded rehearsal)

| Criterion | Result | Evidence |
|---|---|---|
| With secrets: Medplum rehearsal smoke green | **DEGRADED** | Local `.env.local` has `ENABLE_MEDPLUM_SYNC=true` + UUID-shaped `MEDPLUM_CLIENT_ID` / `MEDPLUM_CLIENT_SECRET` + `MEDPLUM_URL=https://api.medplum.com/fhir/R4`. OAuth → HTTP 400 `invalid_request: Invalid client`. Smoke exit 0 with `passMode=degraded_rehearsal_oauth_failed`. |
| Without secrets: dry-run / disabled path still green | **PASS** | `SMOKE_SKIP_DOTENV=1 ENABLE_MEDPLUM_SYNC=false` → `mode=disabled` · `liveEmis:false` · smoke exit 0 |
| VOICE UI labels simulated vs live ASR | **PASS** | Local `DEEPGRAM_API_KEY` missing → `resolveTranscriptionMode()=simulated`. Persistent `voice-simulated-asr-banner` on `VoiceRecorder`; Vitals / Agent Control honesty copy |
| Status API reports mode honestly | **PASS** | `getMedplumRehearsalStatus` + `?probe=auth` / `probeMedplumOAuth`; SystemSpinePanel `medplum-honesty-banner` |
| Never `liveEmis` / invent live EHR | **PASS** | Smoke asserts `liveEmis:false` · `inventedLiveSync:false`; no EMIS claim |
| Secrets not committed | **PASS** | Only code/docs; `.env.local` untracked |
| `npm run test:clinical-proof` | **PASS** | Exit 0 (2026-07-21) |

**P5 exit:** **PASS (degraded rehearsal)** — honest fallbacks green; live Medplum OAuth and local Deepgram still blocked on real secrets from the user.

## What shipped

| Area | Change |
|---|---|
| `lib/medplum-client.ts` | `probeMedplumOAuth()`; clearer notes that CLIENT_ID/SECRET presence ≠ verified OAuth |
| `app/api/integrations/medplum-status/route.ts` | `?probe=auth` (OAuth only, no FHIR write) |
| `scripts/smoke-medplum-rehearsal.mjs` | Loads `.env.local`; direct OAuth probe; `degradedRehearsal` / `passMode`; `SMOKE_SKIP_DOTENV=1` for without-creds |
| `components/dashboard/VoiceRecorder.tsx` | Persistent Simulated ASR / Live Deepgram banners via `GET /api/transcribe` |
| `SystemSpinePanel` · `AgentControlPanel` · `VitalsForm` | Medplum honesty banner + VOICE simulated labelling |
| `tests/clinical-proof-medplum.test.ts` | Auth probe + banner contract asserts |

## Smoke results (2026-07-21)

### A — With local `.env.local` (credentials present, OAuth invalid)

```text
npm run smoke:medplum
→ probe=auth
→ env: enabled=true mode=rehearsal_ready credentialsConfigured=true liveEmis=false
→ oauthDirect: ok=false status=400 error=invalid_request: Invalid client
→ passMode=degraded_rehearsal_oauth_failed
→ exit 0
```

### B — Without credentials (honest disabled)

```text
SMOKE_SKIP_DOTENV=1 ENABLE_MEDPLUM_SYNC=false npm run smoke:medplum
→ mode=disabled credentialsConfigured=false liveEmis=false
→ passMode=disabled_honest
→ exit 0
```

### C — Deepgram / VOICE (local)

```text
DEEPGRAM_API_KEY: MISSING locally
resolveTranscriptionMode → simulated
Vercel: DEEPGRAM_API_KEY present (Preview + Production) — local still simulated until key is in .env.local
```

### D — Clinical proof

```text
npm run test:clinical-proof → exit 0
  (incl. clinical-proof-medplum · spine A–F · NEXUS · orchestration)
```

## Env inventory (names only — never commit values)

| Variable | Local `.env.local` | Vercel (0ne-health) | Needed for green live staging |
|---|---|---|---|
| `ENABLE_MEDPLUM_SYNC` | `true` | **not set** | Set `true` only on staging; keep default `false` in prod unless rehearsing |
| `MEDPLUM_URL` | set (`api.medplum.com/fhir/R4`) | **not set** | Yes for remote Medplum |
| `MEDPLUM_CLIENT_ID` | set (UUID-shaped) | **not set** | Real Medplum Client Application ID |
| `MEDPLUM_CLIENT_SECRET` | set (UUID-shaped → **Invalid client**) | **not set** | **Real Client Secret** from Medplum (not another UUID) |
| `DEEPGRAM_API_KEY` | **missing** | Preview + Production | For local live ASR: add to `.env.local` |

## Exact keys still needed from user

1. **Medplum Client Secret** that belongs to a real Medplum Client Application (current local secret returns `Invalid client`).
2. Confirm **Medplum Client ID** matches that application (re-issue both if unsure).
3. Optionally set on **Vercel staging**: `MEDPLUM_URL`, `MEDPLUM_CLIENT_ID`, `MEDPLUM_CLIENT_SECRET`, `ENABLE_MEDPLUM_SYNC=true` (staging only).
4. For **local live VOICE**: copy `DEEPGRAM_API_KEY` into `.env.local` (already on Vercel).

Until then: dry-run / disabled Medplum paths and simulated ASR remain the honest rehearsal mode. **Still not live EMIS.**

## Fail-if checks (none triggered)

- No `liveEmis:true` / live EMIS marketing from Medplum success
- Missing Deepgram → simulated transcript, not hard error
- Secrets not committed to git
- Clinical-proof green

## Next

**P6 — Full regression audit** — `test:clinical-proof` · `test:workflow` · `typecheck` · marketing E2E · `smoke:all` · partner readiness honesty · gap register → P7 / Phase-2 only.
