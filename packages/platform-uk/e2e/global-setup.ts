import { ensureAuthSchema } from "../lib/auth/user-repository";

export default async function globalSetup() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is required for E2E tests. Set it locally in .env.local or as E2E_DATABASE_URL in CI."
    );
  }

  await ensureAuthSchema();
}
