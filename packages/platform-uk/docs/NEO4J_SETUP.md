# Neo4j AuraDB Setup — Aksh Health Clinical Graph

Phase 11 wires ORACLE, GUARDIAN, and ICS population dashboards to a Neo4j graph. Without credentials, APIs fall back to mock data (`X-Data-Source: mock`) and dashboards show a **mock mode** banner.

> **Scope note:** this wires the demo dashboards to a real Neo4j graph database seeded with richer *synthetic* patients — it does not connect to real NHS patient records. Production-grade "real" clinical data requires an EMIS Web / SystmOne FHIR integration, which is a roadmap item, not a config flag. See [`app/integrations/page.tsx`](../app/integrations/page.tsx) and the "Data And Safety Boundary" section of [`README.md`](../README.md).

## 1. Create AuraDB Free instance

1. Sign in at [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
2. Create a **Free** database (AuraDB Free)
3. Save the connection details when prompted:
   - **URI** — `neo4j+s://xxxx.databases.neo4j.io`
   - **Username** — usually `neo4j`
   - **Password** — generated once; store securely

## Aura console (instance `5982f4dd` — akeno health)

Use the Neo4j Aura console for **akeno health** when you need the live connection string or to confirm seed data.

### Copy the connection URI

1. Open [Neo4j Aura](https://console.neo4j.io/) → **My instance** (`5982f4dd`) — AuraDB Professional, region **europe-west2**.
2. Click **Connect**.
3. Copy **URI** (`neo4j+s://5982f4dd.databases.neo4j.io`) into local `.env.local` and Vercel as `NEO4J_URI` (see tables below). Copy **username** (`neo4j`) and **password** only into secrets — never commit them.

### Verify seed data in the Query tab

1. In the instance, open **Query** (or **Explore** → run Cypher).
2. Run:

```cypher
MATCH (p:Patient) RETURN count(p)
```

Expected after `npm run data:seed:neo4j`: **26** patients (P001–P026 clinical-proof cohort).

### Vercel production checklist (3 steps)

1. **Vercel →** project **0ne-health** → **Settings → Environment Variables** → **Production**.
2. Add:

| Variable | Value |
|----------|--------|
| `NEO4J_URI` | `neo4j+s://5982f4dd.databases.neo4j.io` |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | *(same as Aura / `.env.local` — paste in UI only)* |
| `NEO4J_DATABASE` | `neo4j` *(optional)* |

CLI (optional, password prompted interactively — do not paste into shell history in shared sessions):

```bash
cd packages/platform-uk
vercel env add NEO4J_URI production
vercel env add NEO4J_USERNAME production
vercel env add NEO4J_PASSWORD production
```

3. **Redeploy** Production (Deployments → … → Redeploy). Env changes do not apply until a new deployment.

Confirm:

```bash
curl -s https://0ne-health.vercel.app/api/health
```

`neo4j.mode` should be `"live"` and `neo4j.configured` / `neo4j.connected` should be `true`. Until then you will see `"mode":"mock"`.

## 2. Configure environment variables

### Local development

Add to `packages/platform-uk/.env.local`:

```bash
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
# NEO4J_DATABASE=neo4j   # optional — only needed if you use a non-default database name
```

### Vercel production (`0ne-health` project)

In **Vercel → Project → Settings → Environment Variables**, add these variables for **Production** (and Preview if needed):

| Variable | Required | Example value |
|----------|----------|---------------|
| `NEO4J_URI` | Yes | `neo4j+s://5982f4dd.databases.neo4j.io` |
| `NEO4J_USERNAME` | Yes | `neo4j` |
| `NEO4J_PASSWORD` | Yes | *(Aura-generated password — store only in Vercel)* |
| `NEO4J_DATABASE` | No | `neo4j` (AuraDB Free always uses the default `neo4j` database, so this is normally unset) |

Redeploy after saving. Until `NEO4J_URI`, `NEO4J_USERNAME`, and `NEO4J_PASSWORD` are all set, production uses mock fallback automatically.

See also [DEPLOYMENT_CONSOLIDATION.md](./DEPLOYMENT_CONSOLIDATION.md) for the full env var checklist.

### Health check

Authenticated clients can verify connectivity:

```http
GET /api/neo4j/health
```

Response:

```json
{ "connected": true, "mode": "live" }
```

When credentials are missing or Aura is unreachable, `connected` is `false` and `mode` is `mock`. Clinical APIs continue to serve mock data with `X-Data-Source: mock`.

Public monitoring probe (no auth, no secrets in body):

```http
GET /api/health
```

```json
{
  "status": "ok",
  "database": { "configured": true, "connected": true, "mode": "live" },
  "neo4j": { "configured": true, "connected": true, "mode": "live" }
}
```

## 3. Seed the graph

From `packages/platform-uk`:

```bash
npm run data:seed:neo4j
```

The script is idempotent (`MERGE`) and loads, all sourced from `lib/mock-data/` so the graph always mirrors the dashboard fixtures:

- 26 synthetic patients (P001–P026) with conditions, medications, and observations (BP, heart rate, temperature, SpO₂, respiratory rate) — clinical-proof cohort covering T2D, HTN, HF, COPD, polypharmacy, allergy, pregnancy, paediatric, frailty, renal/liver, MH crisis, oncology, DVT, missing info, duplicate identity, conflicting records, deterioration, and healthy profiles — never real patient data
- Patel **P002** with DVT + T2D, aspirin + apixaban, and `INTERACTS_WITH` (GUARDIAN)
- Medication interaction edges from `lib/mock-data/medications.ts` (BNF section references and dosing)
- ICS aggregates and 5 practice benchmarks from `lib/mock-data/population.ts`

If you edit `lib/mock-data/patients.ts` (e.g. to add more synthetic patients), re-run `npm run data:seed:neo4j` to keep the graph in sync — the seed always reads from that file, so there is a single source of truth for demo data whether Neo4j is connected or not.

### Post-deploy seeding (Aura)

After adding Neo4j env vars to Vercel and redeploying:

1. Copy the three `NEO4J_*` values into local `.env.local` (do not commit).
2. From `packages/platform-uk`, run `npm run data:seed:neo4j` against the Aura instance.
3. Sign in to production and confirm `GET /api/neo4j/health` returns `{ "connected": true, "mode": "live" }`.
4. GP and ICS dashboards should no longer show the mock mode banner.

## 4. Verify

1. Start the app: `npm run dev`
2. Create an account at `/signup` and sign in
3. Open **GP Dashboard** → select **Mr James Patel (P002)**
4. Check ORACLE score and GUARDIAN interaction panel (live when `X-Data-Source: neo4j`)
5. Open **ICS Dashboard** → charts load from `/api/neo4j/ics-population`

### API endpoints (session required)

| Endpoint | Description |
|----------|-------------|
| `GET /api/neo4j/patient?id=P002` | ORACLE score, conditions, medications |
| `GET /api/neo4j/guardian?patientId=P002` | Drug interactions (red/amber/green) |
| `GET /api/neo4j/ics-population` | ICS risk distribution and practice benchmarks |

Response header `X-Data-Source` is `neo4j` or `mock`.

## Graph model

**Nodes:** `Patient`, `Condition`, `Medication`, `Organization`, `ImdQuintile`, `AdmissionForecast`, `EquityFlag`

**Relationships:**

- `(Patient)-[:HAS_CONDITION]->(Condition)`
- `(Patient)-[:TAKES_MEDICATION]->(Medication)`
- `(Medication)-[:INTERACTS_WITH]->(Medication)`
- `(Patient)-[:REGISTERED_AT]->(Organization)`
- `(Organization {type: 'Practice'})-[:REGISTERED_AT]->(Organization {type: 'ICS'})`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ServiceUnavailable` / empty routing table | **Most common:** Aura instance is **Paused**. Open [Neo4j Aura](https://console.neo4j.io/) → select instance → **Resume**. Wait until status is **Running**, then re-check `GET /api/health` (`neo4j.connected` should become `true`). Also confirm URI uses `neo4j+s://`. |
| Auth failed | Regenerate password in Aura console and update local `.env.local` + Vercel `NEO4J_PASSWORD`, then redeploy |
| Empty guardian for P002 | Re-run `npm run data:seed:neo4j` after Aura is Running |
| APIs return mock | Confirm all three `NEO4J_*` env vars are set **and** Aura is Running |
| Mock mode banner visible | Neo4j unreachable or not configured — check Vercel env vars and Aura status (Paused vs Running) |

## Authenticated Neo4j smoke

```bash
# Against production (creates throwaway GP unless SMOKE_GP_* set)
SMOKE_BASE_URL=https://akshhealth.com npm run smoke:neo4j

# Optional: reuse a known GP account instead of signup
SMOKE_GP_EMAIL=you@example.com SMOKE_GP_PASSWORD=... npm run smoke:neo4j
```

Asserts:

1. `/api/health` neo4j honesty (`live` ⇒ `connected: true`)
2. Public `/api/neo4j/ics-population` → `X-Data-Source: demo`
3. Signed-in patient + guardian + ICS → `X-Data-Source: neo4j` when Aura live

Throwaway password defaults to `E2eTestPass1!` (override with `E2E_TEST_PASSWORD`).

### Exact fix when production shows `neo4j.configured: true` but `connected: false`

1. Open Aura console → instance (`5982f4dd` / akeno health).
2. If status is **Paused**, click **Resume** and wait for **Running** (often 30–90 seconds).
3. From `packages/platform-uk` with matching `.env.local`, run `npm run data:seed:neo4j` if the graph was emptied on pause/recreate.
4. Confirm:
   - `curl -s https://akshhealth.com/api/health` → `neo4j.mode: "live"`, `connected: true`
   - Signed-in `GET /api/neo4j/health` → `{ "connected": true, "mode": "live" }`
5. No code deploy is required solely to resume Aura; redeploy only if you changed Vercel env vars.
