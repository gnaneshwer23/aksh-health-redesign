import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

import { authOptions } from "@/lib/auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { reportError } from "@/lib/observability/errors";

import { loadNetworkContext } from "./context";
import { NetworkError } from "./service";

export type Actor = { userId: string; email: string; displayName: string; role: string | null };

/** The signed-in user, or a 401 response. */
export async function requireActor(): Promise<Actor | NextResponse> {
  if (!isPostgresConfigured()) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string | null; name?: string | null; role?: string } | undefined;
  if (!user?.id || !user.email) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return { userId: user.id, email: user.email, displayName: user.name?.trim() || user.email, role: user.role ?? null };
}

export async function requireContext() {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  return { actor, ctx: await loadNetworkContext(actor.userId, actor.role) };
}

/** Expected failures map to their status; anything else is a fault, recorded (scrubbed) and alerted before the 500. */
export async function errorResponse(error: unknown, route?: string) {
  if (error instanceof NetworkError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
  await reportError(error, { source: "server", route });
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
