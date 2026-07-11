# Neo4j AuraDB Setup — Aksh Health Clinical Graph

Phase 11 wires ORACLE, GUARDIAN, and ICS population dashboards to a Neo4j graph. Without credentials, APIs fall back to mock data (`X-Data-Source: mock`) and dashboards show a **mock mode** banner.

## 1. Create AuraDB Free instance

1. Sign in at [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
2. Create a **Free** database (AuraDB Free)
3. Save the connection details when prompted:
   - **URI** — `neo4j+s://xxxx.databases.neo4j.io`
   - **Username** — usually `neo4j`
   - **Password** — generated once; store securely

## 2. Configure environment variables

### Local development

Add to `packages/platform-uk/.env.local`:

```bash
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
```

### Vercel production (`0ne-health` project)

In **Vercel → Project → Settings → Environment Variables**, add these three variables for **Production** (and Preview if needed):

| Variable | Example value |
|----------|---------------|
| `NEO4J_URI` | `neo4j+s://xxxx.databases.neo4j.io` |
| `NEO4J_USERNAME` | `neo4j` |
| `NEO4J_PASSWORD` | *(Aura-generated password — store only in Vercel)* |

Redeploy after saving. Until all three are set, production uses mock fallback automatically.

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

The script is idempotent (`MERGE`) and loads:

- 12 patients (P001–P012) with conditions and medications
- Patel **P002** with DVT + T2D, aspirin + apixaban, and `INTERACTS_WITH` (GUARDIAN)
- Medication interaction edges from `lib/mock-data/medications.ts`
- ICS aggregates and 5 practice benchmarks from `lib/mock-data/population.ts`

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
| `ServiceUnavailable` | Check URI uses `neo4j+s://` for Aura |
| Auth failed | Regenerate password in Aura console |
| Empty guardian for P002 | Re-run `npm run data:seed:neo4j` |
| APIs return mock | Confirm all three `NEO4J_*` env vars are set |
| Mock mode banner visible | Neo4j unreachable or not configured — check Vercel env vars and Aura status |
