# N2 Audit — Staging secrets: Medplum OAuth + local Deepgram

**Date:** 2026-07-22  
**Branch:** `main`  
**Scope:** Verify staging Medplum Client Secret + optional local Deepgram. Still not Layer 15 EHR. `liveEmis:false` hard.

## Status

| Gate | Result |
|---|---|
| **N2 overall** | **PARTIAL** |
| **Medplum OAuth (with local creds)** | **DEGRADED** — `Invalid client` (UUID-shaped secret) |
| **Medplum without creds** | **PASS** — `passMode=disabled_honest` |
| **VOICE / Deepgram local** | **PASS (simulated)** — `DEEPGRAM_API_KEY` missing locally |
| **`liveEmis`** | **`false`** (unchanged; do not flip) |

**Do not treat PARTIAL as green staging OAuth.** Live Medplum rehearsal still blocked on a real Client Secret from Medplum App → Clients.

## Exit criteria (from [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) N2)

| Criterion | Result | Notes |
|---|---|---|
| With secrets: Medplum OAuth smoke green (not `Invalid client`) | ☐ **Open / DEGRADED** | Local UUID-shaped `MEDPLUM_CLIENT_*` → HTTP 400 `invalid_request: Invalid client`; smoke exit 0 · `passMode=degraded_rehearsal_oauth_failed` |
| Without: dry-run / simulated paths still green and labelled | **PASS** | `SMOKE_SKIP_DOTENV=1 ENABLE_MEDPLUM_SYNC=false` → `disabled_honest`; VOICE simulated banner |
| Fail if Medplum success used to claim live EMIS | **PASS** | No success; honesty banners keep `liveEmis:false` |
| Fail if missing-key path errors instead of honest fallback | **PASS** | Simulated ASR labelled; Medplum disabled path honest |
| Fail if secrets committed to git | **PASS** | Docs/code only; `.env.local` untracked |

## Smoke results (2026-07-22)

### A — With local `.env.local` (credentials present, OAuth invalid)

```text
npm run smoke:medplum
→ probe=auth
→ env: enabled=true mode=rehearsal_ready credentialsConfigured=true liveEmis=false
→ oauthDirect: ok=false status=400 error=invalid_request: Invalid client
→ passMode=degraded_rehearsal_oauth_failed
→ exit 0
```

Local endpoint `http://127.0.0.1:3000` unreachable in this session — env/oauth documented only (not a live sync claim).

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
voice-simulated-asr-banner present
Prior P5 note: Vercel Preview + Production may already have DEEPGRAM_API_KEY — local still simulated until copied into .env.local
```

No dedicated `smoke:voice` script — honesty verified via `VoiceRecorder` banner + transcription config.

### D — Clinical proof (after honesty harden)

```text
npm run test:clinical-proof → exit 0 (2026-07-22)
  (incl. clinical-proof-medplum · spine A–F · NEXUS · orchestration)
```

## Env inventory (names only — never commit values)

| Variable | Local `.env.local` | Needed for green live staging |
|---|---|---|
| `ENABLE_MEDPLUM_SYNC` | `true` | Staging only; keep default `false` in prod unless rehearsing |
| `MEDPLUM_URL` | set (`api.medplum.com/fhir/R4`) | Yes for remote Medplum |
| `MEDPLUM_CLIENT_ID` | present · UUID-shaped | Real Medplum Client Application ID |
| `MEDPLUM_CLIENT_SECRET` | present · UUID-shaped → **Invalid client** | **Real Client Secret** from Medplum (not another UUID) |
| `DEEPGRAM_API_KEY` | **missing** | Optional for local live ASR (may already be on Vercel) |
| Live EMIS flags | **absent** | Must stay off |

## Exact user actions still needed

1. Open **Medplum App → Clients** → select the Client Application that matches your intended staging `MEDPLUM_CLIENT_ID`.
2. **Regenerate Client Secret** (do not reuse a UUID placeholder or copied ID as the secret).
3. Set in **`.env.local`** (and optionally **Vercel staging**):
   - `MEDPLUM_CLIENT_ID` = that Client Application ID  
   - `MEDPLUM_CLIENT_SECRET` = the newly generated secret  
   - `MEDPLUM_URL=https://api.medplum.com/fhir/R4` (or your staging host)  
   - `ENABLE_MEDPLUM_SYNC=true` on staging only  
4. Re-run: `npm run smoke:medplum` until `oauthDirect.ok=true` / not `degraded_rehearsal_oauth_failed`.
5. Optional local VOICE: copy `DEEPGRAM_API_KEY` into `.env.local` (if present on Vercel).
6. **Never** set `liveEmis` / Partner live write-back from Medplum success.

Until then: dry-run / disabled Medplum paths and simulated ASR remain the honest rehearsal mode. **Still not live EMIS.**

## What shipped this session

| Area | Change |
|---|---|
| `SystemSpinePanel` | Amber honesty banner when flag on; regenerate Client Secret copy for keys-present / Invalid client |
| `lib/medplum-client.ts` | Status note points at Medplum App → Clients regenerate |
| `medplum-status` route | Same regenerate guidance in note |
| `VoiceRecorder` | Simulated ASR notes Vercel may already have Deepgram key |
| Docs | This audit + [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md) N2 checkboxes |

## Fail-if checks (none triggered)

- No `liveEmis:true` / live EMIS marketing from Medplum
- Missing Deepgram → simulated transcript, not hard error
- Secrets not committed to git
- Honest dry-run / disabled paths exit 0

## Go / no-go

| Recommendation | Rationale |
|---|---|
| **PARTIAL — N2 eng complete for honest dry-run** | Smokes + banners match reality; OAuth still bad |
| **NO-GO — mark N2 OAuth exit complete** | Need real Client Secret from user |
| **NO-GO — `liveEmis` flip** | Unchanged; requires N6–N7 signed path |
| **NO-GO — N3 green BRIDGE staging** | Blocked until Medplum OAuth green |

## Next

**N3** — BRIDGE staging rehearsal hardening (Capture → Draft → HITL → staging FHIR) **after** Medplum OAuth is green. Until then, eng can parallel **N4** (roster honesty / coding-assist clarity). See [`NEXT_BUILD_STEPS.md`](./NEXT_BUILD_STEPS.md).
