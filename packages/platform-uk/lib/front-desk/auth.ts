import { requireAuthenticatedUserScope, type AuthenticatedUserScope } from "@/lib/user-scope";

/** Signed-in scope if there is one; null for public demo viewers (never an error). */
export async function getOptionalAuthenticatedUserScope(request: Request): Promise<AuthenticatedUserScope | null> {
  const auth = await requireAuthenticatedUserScope(request);
  return auth.context ?? null;
}
