# Deployment consolidation

## Authoritative production map

| Setting | Value |
|---------|-------|
| Production domain | https://www.akshhealth.com |
| Vercel project | `aksh-health-redesign` |
| Root directory | `packages/platform-uk` |
| GitHub repo | https://github.com/gnaneshwer23/aksh-health-redesign (branch: `main`) |
| Proof environment (noindex) | https://aksh-clinical-proof.vercel.app — same git SHA as production; clinical proof / rehearsal surfaces |

Capability register: `packages/platform-uk/lib/status/capabilities.ts`. Production status means deployed and verified on www.akshhealth.com with passing tests; **LIVE_ORGANISATIONS** may still be `0`.

### Required environment variables (production)

- `DATABASE_URL` — Neon Postgres (production project; not local child branches)
- `USE_POSTGRES=true`
- `NEXTAUTH_URL=https://www.akshhealth.com`
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`

Local development should use a Neon **child branch** (simulation) via `packages/platform-uk/.env.local`. Never write to production Neon main from local tools.

## Related / legacy Vercel projects

Do **not** delete Vercel projects from this documentation or by scripted cleanup here. Retire only after an explicit ops decision.

| Project / URL | Status |
|---------------|--------|
| `aksh-health-redesign` → www.akshhealth.com | **Production** |
| `aksh-clinical-proof` → aksh-clinical-proof.vercel.app | Proof / noindex; same commit as production |
| `0ne-health` → 0ne-health.vercel.app | **Legacy / older deploy** — superseded; docs that call it production are stale |
| Other historical projects (e.g. older `aksh-health`, `marketing-os`) | Superseded; leave in place until ops retires them |

### Packages that must not be deployed as the live site

- `packages/aksh-health` — legacy marketing scaffold with outdated ICS pilot claims
- `packages/marketing-os` — retired; content merged into `platform-uk`

## Route map (unified app — `packages/platform-uk`)

| Route | Purpose |
|-------|---------|
| `/` | Marketing homepage (diabetes workflows) |
| `/platform` | How it works |
| `/product` | What is available now |
| `/demo` | Synthetic guided workflow demos (catalog) |
| `/demo/slot-fill` | Cancelled-slot fill interactive demo |
| `/demo/glucose` | Glucose / CGM monitoring interactive demo |
| `/agents`, `/security`, `/resources`, `/get-started` | Audience and setup pages |
| `/signup`, `/onboarding/*` | Sign up and role onboarding |
| `/dashboard/*`, `/workspace` | Authenticated role surfaces |
| `/api/*` | Neon Postgres when `USE_POSTGRES=true` |

## User journey

1. Land on `/` (marketing)
2. Explore a synthetic demo (`/demo`) or request a pilot (`/get-started`)
3. Sign in / complete `/onboarding/*`
4. Arrive at organisation workspace / dashboards

All primary links are same-origin on www.akshhealth.com.
