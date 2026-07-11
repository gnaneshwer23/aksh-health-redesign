# Deployment consolidation

**Production:** https://0ne-health.vercel.app — single deploy from `packages/platform-uk`

## Single Vercel project

| Setting | Value |
|---------|-------|
| Project | `0ne-health` |
| Root directory | `packages/platform-uk` |
| Git repo | `gnaneshwer23/0ne-Health` (branch: `main`) |
| Production URL | https://0ne-health.vercel.app |

### Required environment variables

- `DATABASE_URL` — Neon Postgres connection string
- `USE_POSTGRES=true` — enable Postgres in production
- `NEXTAUTH_URL=https://0ne-health.vercel.app`
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`

## Retired Vercel projects

The following projects are **superseded** by the unified `0ne-health` deployment. After confirming production is stable, delete them or add domain redirects to `https://0ne-health.vercel.app`:

| Project | Former URL | Action |
|---------|------------|--------|
| `aksh-health` | https://aksh-health.vercel.app | Delete or redirect → 0ne-health |
| `marketing-os` | https://marketing-os-phi-plum.vercel.app | Delete or redirect → 0ne-health |

### Redirect via vercel.json (optional)

Add to each retired project's root `vercel.json`:

```json
{
  "redirects": [
    { "source": "/(.*)", "destination": "https://0ne-health.vercel.app/$1", "permanent": true }
  ]
}
```

## Route map (unified app)

| Route | Purpose |
|-------|---------|
| `/` | Marketing homepage |
| `/platform`, `/for-clinicians`, `/for-hospitals`, `/for-patients`, `/docs` | Audience pages |
| `/pilot`, `/pilot/apply` | Pilot programme |
| `/signup` | Sign up → `/onboarding/role-select` (optional `?role=`) |
| `/onboarding/*` | 8-role personalised onboarding |
| `/dashboard/*` | Role dashboards |
| `/demo/patel` | Investor demo |
| `/api/*` | Neon Postgres when `USE_POSTGRES=true` |

## User journey

1. Land on `/` (marketing)
2. Click **Sign In** or visit `/signup?role=gp`
3. Complete `/onboarding/*` flow
4. Arrive at `/dashboard/{role}`

All links are same-origin — no cross-domain redirects.
