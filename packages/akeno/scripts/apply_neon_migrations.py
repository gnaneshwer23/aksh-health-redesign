#!/usr/bin/env python3
"""Apply Akeno SQL migrations to Neon/Postgres using DATABASE_URL or POSTGRES_DSN."""

from pathlib import Path
import os
import sys

import psycopg


ROOT = Path(__file__).resolve().parents[1]
MIGRATION_FILES = [
    ROOT / "services/identity-consent/app/migrations/001_identity_consent.sql",
    ROOT / "services/l0-l2-ingestion/app/migrations/001_create_ingestion_events.sql",
    ROOT / "services/identity-consent/app/migrations/002_dpdpa_consent.sql",
]


def main() -> int:
    dsn = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_DSN")
    if not dsn:
        print("Set DATABASE_URL or POSTGRES_DSN before running migrations.", file=sys.stderr)
        return 1

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    migration_name TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
            for migration_file in MIGRATION_FILES:
                name = migration_file.name
                cur.execute("SELECT 1 FROM schema_migrations WHERE migration_name = %s", (name,))
                if cur.fetchone():
                    print(f"skip: {name}")
                    continue
                cur.execute(migration_file.read_text())
                cur.execute("INSERT INTO schema_migrations (migration_name) VALUES (%s)", (name,))
                print(f"applied: {name}")

    print("Neon migrations complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
