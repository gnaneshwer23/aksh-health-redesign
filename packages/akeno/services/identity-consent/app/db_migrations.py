from pathlib import Path
import time

import psycopg

from .settings import POSTGRES_DSN


def run_migrations() -> None:
    migrations_dir = Path(__file__).resolve().parent / "migrations"
    files = sorted(migrations_dir.glob("*.sql"))
    if not files:
        return

    conn = None
    last_error = None
    for attempt in range(1, 11):
        try:
            conn = psycopg.connect(POSTGRES_DSN)
            break
        except psycopg.OperationalError as exc:
            last_error = exc
            time.sleep(1.0 * attempt)
    if conn is None:
        raise last_error if last_error else RuntimeError("Unable to connect to Postgres for migrations.")

    with conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    migration_name TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            for migration_file in files:
                cur.execute(
                    "SELECT 1 FROM schema_migrations WHERE migration_name = %s",
                    (migration_file.name,),
                )
                if cur.fetchone():
                    continue
                cur.execute(migration_file.read_text())
                cur.execute(
                    "INSERT INTO schema_migrations (migration_name) VALUES (%s)",
                    (migration_file.name,),
                )
