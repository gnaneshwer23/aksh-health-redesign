import { NextResponse } from "next/server";

import {
  listPurposeCatalogue,
  purposeCodeSchema,
  type ConsentGrantInput
} from "@/lib/precision-health/consent";
import { modalityIdSchema } from "@/lib/precision-health/modalities";
import {
  listConsentGrants,
  upsertConsentGrant
} from "@/lib/repositories/consent-grant-repository";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";

export const maxDuration = 30;

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  const url = new URL(request.url);
  const patientId = url.searchParams.get("patientId") ?? undefined;
  const includeRevoked = url.searchParams.get("includeRevoked") === "true";

  const grants = await listConsentGrants({
    scopeKey: auth.context.scopeKey,
    patientId,
    includeRevoked
  });

  return NextResponse.json({
    purposes: listPurposeCatalogue(),
    grants,
    ehrWrite: false,
    hitlRequired: true,
    note: "Purpose-bound consent registry (Phase 1). Does not replace DPIA or health system Login."
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response || !auth.context) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const actor = auth.context.userEmail ?? auth.context.userId;

  try {
    if (body.revokeGrantId && typeof body.revokeGrantId === "string") {
      const result = await upsertConsentGrant(
        {
          patientId: String(body.patientId ?? "unknown"),
          purposeCode: "care_delivery",
          modalities: ["clinical"],
          grantedBy: actor,
          revokeGrantId: body.revokeGrantId
        },
        { scopeKey: auth.context.scopeKey, actor }
      );

      return NextResponse.json({
        action: result.action,
        grant: result.grant,
        ehrWrite: false,
        shieldLogged: true
      });
    }

    const purposeParsed = purposeCodeSchema.safeParse(body.purposeCode);
    if (!purposeParsed.success) {
      return NextResponse.json({ error: "Invalid purposeCode." }, { status: 400 });
    }

    const modalitiesRaw = Array.isArray(body.modalities) ? body.modalities : [];
    const modalities = modalitiesRaw
      .map((m) => modalityIdSchema.safeParse(m))
      .filter((r) => r.success)
      .map((r) => r.data);

    if (!modalities.length) {
      return NextResponse.json({ error: "At least one valid modality is required." }, { status: 400 });
    }

    const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
    if (!patientId) {
      return NextResponse.json({ error: "patientId is required." }, { status: 400 });
    }

    const input: ConsentGrantInput = {
      patientId,
      purposeCode: purposeParsed.data,
      modalities,
      grantedBy: actor,
      notes: typeof body.notes === "string" ? body.notes : undefined
    };

    const result = await upsertConsentGrant(input, {
      scopeKey: auth.context.scopeKey,
      actor
    });

    return NextResponse.json({
      action: result.action,
      grant: result.grant,
      ehrWrite: false,
      shieldLogged: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Consent grant failed." },
      { status: 400 }
    );
  }
}
