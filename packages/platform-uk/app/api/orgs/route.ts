import { NextResponse } from "next/server";

import { withTenant } from "@/lib/network/db";
import { errorResponse, requireActor, requireContext } from "@/lib/network/http";
import { createOrganisation, createOrganisationSchema } from "@/lib/network/service";

export const dynamic = "force-dynamic";

/** GET /api/orgs — organisations the signed-in user belongs to. */
export async function GET() {
  const r = await requireContext();
  if (r instanceof NextResponse) return r;
  try {
    const rows = await withTenant(r.ctx, async (client) =>
      (await client.query(`SELECT id, name, kind, status, region, locale FROM aksh.organisations ORDER BY name`)).rows
    );
    return NextResponse.json({ rows: rows.map((o) => ({ ...o, isAdmin: r.ctx.adminOrgIds.includes(o.id) })) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/orgs — create an organisation; the creator becomes its first admin. New organisations start in sandbox. */
export async function POST(request: Request) {
  const actor = await requireActor();
  if (actor instanceof NextResponse) return actor;
  try {
    const input = createOrganisationSchema.parse(await request.json().catch(() => ({})));
    return NextResponse.json(await createOrganisation(actor, input), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
