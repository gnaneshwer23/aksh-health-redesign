import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { recordError } from "@/lib/observability/errors";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().max(120).optional(),
  message: z.string().max(2000),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(64).optional(),
  route: z.string().max(300).optional(),
});

/** POST /api/telemetry/error — browser error boundaries report crashes here. Scrubbed and rate limited per address. */
export async function POST(request: Request) {
  const limited = await checkRateLimit(`client-error:${getClientIp(request)}`, 20, 10 * 60 * 1000);
  if (!limited.success) return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  await recordError({ source: "client", ...parsed.data, userId });
  return new NextResponse(null, { status: 204 });
}
