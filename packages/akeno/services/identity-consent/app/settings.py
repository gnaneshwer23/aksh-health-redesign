import os

POSTGRES_DSN = os.getenv("DATABASE_URL") or os.getenv(
    "POSTGRES_DSN", "postgresql://akeno:akeno@localhost:5433/akeno"
)
