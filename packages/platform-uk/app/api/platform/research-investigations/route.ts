import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { akshInvestigationDatabase } from "@/lib/hsi/investigation-db.server";
import { akshInvestigationReleases, loadAkshInvestigationRelease } from "@/lib/hsi/investigation-corpus.server";
import { createOwnedInvestigationBackend, readInvestigationRequest, investigationError, investigationJson } from "@/lib/hsi/investigationBackend";
import type { ResearchActor } from "@/lib/hsi/investigationService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  // No test-header shortcut on this endpoint: verify the product's actual NextAuth session.
  const auth = await requireAuthenticatedUserScope();
  if (!auth.context) return investigationJson({ error: "sign_in_required" }, 401);
  try {
    const database = akshInvestigationDatabase(auth.context.userId);
    const [grant] = await database.query("SELECT role FROM aksh.hsi_research_members WHERE owner_id=$1", [auth.context.userId]);
    if (!grant || !["researcher", "reviewer", "admin"].includes(String(grant.role))) return investigationJson({ error: "research_access_required" }, 403);
    const command = await readInvestigationRequest(request);
    const backend = createOwnedInvestigationBackend({ database, schema: "aksh",
      principal: { ownerId: auth.context.userId, actor: { id: auth.context.userId, role: grant.role as ResearchActor["role"] } },
      releases: akshInvestigationReleases, loadRelease: loadAkshInvestigationRelease,
    });
    return investigationJson(await backend.execute(command));
  } catch (error) { return investigationError(error); }
}
