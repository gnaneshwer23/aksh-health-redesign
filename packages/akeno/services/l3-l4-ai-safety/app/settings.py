import os


KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_AUDIT = os.getenv("KAFKA_TOPIC_AUDIT", "akeno.ai.audit.events")
KAFKA_TOPIC_AUDIT_DLQ = os.getenv("KAFKA_TOPIC_AUDIT_DLQ", "akeno.ai.audit.events.dlq")
KAFKA_PUBLISH_RETRIES = int(os.getenv("KAFKA_PUBLISH_RETRIES", "3"))
