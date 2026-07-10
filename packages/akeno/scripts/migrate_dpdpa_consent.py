#!/usr/bin/env python3
"""Apply or dry-run DPDPA consent migration (002_dpdpa_consent.sql).

Usage:
  python scripts/migrate_dpdpa_consent.py --dry-run
  POSTGRES_DSN=postgresql://... python scripts/migrate_dpdpa_consent.py
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

MIGRATION = (
    Path(__file__).resolve().parent.parent
    / "services/identity-consent/app/migrations/002_dpdpa_consent.sql"
)


def main() -> None:
    parser = argparse.ArgumentParser(description="DPDPA consent schema migration stub")
    parser.add_argument("--dry-run", action="store_true", help="Print SQL without applying")
    args = parser.parse_args()

    sql = MIGRATION.read_text()
    if args.dry_run:
        print("-- dry-run: would apply", MIGRATION.name)
        print(sql)
        return

    dsn = os.environ.get("POSTGRES_DSN") or os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("Set POSTGRES_DSN or DATABASE_URL to apply migration")

    import psycopg

    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
    print("Applied", MIGRATION.name)


if __name__ == "__main__":
    main()
