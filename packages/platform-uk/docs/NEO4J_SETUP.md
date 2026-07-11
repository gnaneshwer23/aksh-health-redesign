# Neo4j AuraDB Setup — Aksh Health Clinical Graph

Phase 11 wires ORACLE, GUARDIAN, and ICS population dashboards to a Neo4j graph. Without credentials, APIs fall back to mock data (`X-Data-Source: mock`).

## 1. Create AuraDB Free instance

1. Sign in at [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
2. Create a **Free** database (AuraDB Free)
3. Save the connection details when prompted:
   - **URI** — `neo4j+s://xxxx.databases.neo4j.io`
   - **Username** — usually `neo4j`
   - **Password** — generated once; store securely

## 2. Configure environment variables

Add to `packages/platform-uk/.env.local`:

```bash
NEO4J_URI=neo4j+s://YOUR_INSTANCE.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
```

For Vercel production, add the same three variables in the project settings (see [DEPLOYMENT_CONSOLIDATION.md](./DEPLOYMENT_CONSOLIDATION.md)). Until they are set, production uses mock fallback automatically.

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

## 4. Verify

1. Start the app: `npm run dev`
2. Sign in as `doctor@akshhealth.com` / `demo123`
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
