from typing import Any, Dict
import json
import time

from kafka import KafkaProducer

from .settings import (
    KAFKA_BOOTSTRAP_SERVERS,
    KAFKA_PUBLISH_RETRIES,
    KAFKA_TOPIC_INGESTION,
    KAFKA_TOPIC_INGESTION_DLQ,
)


def publish_ingestion_event(event: Dict[str, Any], quality_score: float) -> None:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    payload = {
        "eventId": event["eventId"],
        "patientKey": event["patientKey"],
        "sourceType": event["sourceType"],
        "qualityScore": quality_score,
    }
    last_error = None
    try:
        for attempt in range(1, KAFKA_PUBLISH_RETRIES + 1):
            try:
                producer.send(KAFKA_TOPIC_INGESTION, payload).get(timeout=3)
                producer.flush(timeout=3)
                return
            except Exception as exc:
                last_error = exc
                time.sleep(0.2 * attempt)
        producer.send(
            KAFKA_TOPIC_INGESTION_DLQ,
            {"error": str(last_error), "failedPayload": payload},
        ).get(timeout=3)
        producer.flush(timeout=3)
    finally:
        producer.close()
