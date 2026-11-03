import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { akshInvestigationDatabase } from "@/lib/hsi/investigation-db.server";
import InvestigationPanel from "@/components/hsi/InvestigationPanel";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Internal research", robots: { index: false, follow: false } };
export default async function InternalResearchPage() {
  const auth = await requireAuthenticatedUserScope();
  if (!auth.context) redirect("/signin");
  let allowed = false;
  try {
    const [grant] = await akshInvestigationDatabase(auth.context.userId).query("SELECT role FROM aksh.hsi_research_members WHERE owner_id=$1", [auth.context.userId]);
    allowed = !!grant && ["researcher", "reviewer", "admin"].includes(String(grant.role));
  } catch { /* No sample/file fallback when product storage is unavailable. */ }
  return <main className="mx-auto max-w-6xl p-6"><h1 className="text-3xl font-semibold">Internal research workspace</h1>{allowed ? <InvestigationPanel /> : <p className="mt-6" role="status">A provisioned research account and configured research storage are required. Ask your organisation administrator to check access.</p>}</main>;
}
