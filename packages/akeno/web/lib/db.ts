import { neon } from "@neondatabase/serverless";

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_DSN;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_DSN is not configured");
  }
  return neon(databaseUrl);
}
