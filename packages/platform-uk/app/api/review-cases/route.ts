import { NextResponse } from "next/server";

import { requestFastApiSynthesis } from "@/lib/fastapi-synthesis";
import { isFastApiSynthesisEnabled } from "@/lib/integration-config";
import { resolveTenantContext } from "@/lib/db/tenant-context";
import { createReviewCase, readReviewCases, resetReviewCases } from "@/lib/review-case-repository";
import type { ConsultationInput } from "@/lib/types";
import { requireAuthenticatedUserScope } from "@/lib/user-scope";
import { createReviewCaseFromIntake } from "@/lib/workflow";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey } = auth.context;
  const tenant = resolveTenantContext(request, auth.context);
  const cases = await readReviewCases(scopeKey, tenant.practiceId);
  return NextResponse.json({ cases, practiceId: tenant.practiceId });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedUserScope();
  if (auth.response) return auth.response;

  const { scopeKey, userId } = auth.context;
  const tenant = resolveTenantContext(request, auth.context);
  const body = (await request.json().catch(() => null)) as
    | {
        action?: string;
        patientLabel?: string;
        rawInput?: string;
        sourceType?: ConsultationInput["sourceType"];
        options?: {
          pathwayHint?: "auto" | "respiratory" | "hypertension" | "eczema" | "lipid" | "general";
          confidenceMode?: "auto" | "conservative" | "standard";
          includeMedicationDraft?: boolean;
          sourceProfile?: ConsultationInput["sourceProfile"];
          inferredContextOverrides?: {
            allergies?: string[];
            currentMedications?: string[];
            medicationMention?: string;
            bloodPressure?: string;
            temperature?: string;
          };
        };
      }
    | null;

  if (body?.action === "reset") {
    const cases = await resetReviewCases(scopeKey, tenant.practiceId);
    return NextResponse.json({ cases });
  }

  if (body?.action === "create") {
    if (!body.rawInput?.trim()) {
      return NextResponse.json({ error: "Raw input is required" }, { status: 400 });
    }

    const intakeArgs = {
      patientLabel: body.patientLabel ?? "",
      rawInput: body.rawInput,
      sourceType: body.sourceType ?? "note" as const,
      options: body.options
    };

    if (!isFastApiSynthesisEnabled()) {
      const reviewCase = createReviewCaseFromIntake(intakeArgs);
      const created = await createReviewCase(reviewCase, scopeKey, userId, tenant.practiceId);
      return NextResponse.json(
        {
          reviewCase: created,
          synthesisMode: "deterministic_synthetic"
        },
        { status: 201 }
      );
    }

    const synthesis = await requestFastApiSynthesis({
      transcript: body.rawInput,
      sourceType: body.sourceType ?? "note"
    });

    if (!synthesis.ok) {
      return NextResponse.json(
        {
          error: synthesis.error,
          synthesisMode: "integration_rehearsal_failed"
        },
        { status: synthesis.status }
      );
    }

    const reviewCase = createReviewCaseFromIntake(intakeArgs);

    if (synthesis.data.fhir_draft) {
      reviewCase.draft = synthesis.data.fhir_draft;
    }

    if (synthesis.data.extracted_summary) {
      reviewCase.summary = synthesis.data.extracted_summary;
    }

    if (synthesis.data.safety_flags?.length) {
      reviewCase.summary = `${reviewCase.summary} Safety flags: ${synthesis.data.safety_flags.join("; ")}.`;
    }

    const created = await createReviewCase(reviewCase, scopeKey, userId, tenant.practiceId);
    return NextResponse.json(
      {
        reviewCase: created,
        synthesisMode: "fastapi_rehearsal"
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
