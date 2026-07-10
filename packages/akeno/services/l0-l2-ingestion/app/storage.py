from typing import Any, Dict, List

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json
from neo4j import GraphDatabase

from .settings import POSTGRES_DSN, NEO4J_PASSWORD, NEO4J_URI, NEO4J_USER


def persist_event(event: Dict[str, Any], quality_score: float) -> None:
    with psycopg.connect(POSTGRES_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_events (event_id, patient_key, source_type, payload_type, quality_score, payload_json)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (event_id) DO UPDATE
                SET quality_score = EXCLUDED.quality_score,
                    payload_json = EXCLUDED.payload_json
                """,
                (
                    event["eventId"],
                    event["patientKey"],
                    event["sourceType"],
                    event["payloadType"],
                    quality_score,
                    Json(event["payload"]),
                ),
            )


def fetch_patient_events(patient_key: str) -> List[Dict[str, Any]]:
    with psycopg.connect(POSTGRES_DSN, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT event_id, patient_key, source_type, payload_type, quality_score, payload_json, created_at
                FROM ingestion_events
                WHERE patient_key = %s
                ORDER BY created_at ASC
                """,
                (patient_key,),
            )
            return list(cur.fetchall())


def get_graph_summary(patient_key: str) -> Dict[str, Any]:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (p:Patient {patientKey: $patient_key})
                OPTIONAL MATCH (p)-[r]-()
                RETURN count(DISTINCT p) AS nodeCount, count(r) AS edgeCount, p.lastUpdated AS lastUpdated
                """,
                patient_key=patient_key,
            ).single()
            if not result or result["nodeCount"] == 0:
                return {"nodeCount": 0, "edgeCount": 0, "lastUpdated": None}
            last_updated = result["lastUpdated"]
            return {
                "nodeCount": int(result["nodeCount"]),
                "edgeCount": int(result["edgeCount"]),
                "lastUpdated": last_updated.isoformat() if last_updated else None,
            }
    finally:
        driver.close()


def upsert_patient_graph_projection(event: Dict[str, Any]) -> None:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        with driver.session() as session:
            session.run(
                """
                MERGE (p:Patient {patientKey: $patient_key})
                SET p.lastUpdated = datetime()
                MERGE (s:SourceSystem {name: $source_system})
                MERGE (p)-[:HAS_DATA_FROM]->(s)
                """,
                patient_key=event["patientKey"],
                source_system=event["sourceSystem"],
            )
    finally:
        driver.close()
