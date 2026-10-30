import { NextResponse } from "next/server";

import { correlateCareEpisodeStage, readCareEpisodeId } from "@/lib/care-episode";
import { requestFastApiSynthesis } from "@/lib/fastapi-synthesis";
import { isConductorFromIntakeEnabled, isFastApiSynthesisEnabled } from "@/lib/integration-config";
import { maybeConductorFromIntake } from "@/lib/intake/conductor-from-intake";
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
        patientId?: string;
        rawInput?: string;
        sourceType?: ConsultationInput["sourceType"];
        careEpisodeId?: string;
        care_episode_id?: string;
        /** P2-INTAKE-01 — only runs when ENABLE_CONDUCTOR_FROM_INTAKE=true. */
        orchestrateAfterIntake?: boolean;
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

    const actor = auth.context.userEmail ?? userId;
    const patientId = body.patientId?.trim();

    async function attachEpisode(reviewCaseId: string, patientLabel: string) {
      if (!patientId) return undefined;
      const correlated = await correlateCareEpisodeStage({
        patientId,
        patientLabel,
        actor,
        scopeKey,
        careEpisodeId: readCareEpisodeId(body ?? {}),
        stage: "intake",
        linkId: reviewCaseId,
        linkLabel: "Intake review case",
        practiceId: tenant.practiceId,
      });
      return correlated.careEpisodeId;
    }

    async function withConductorOffer(
      created: { id: string; patientLabel: string; careEpisodeId?: string },
      careEpisodeId: string | undefined,
      extra: Record<string, unknown>
    ) {
      const conductorFromIntake = await maybeConductorFromIntake({
        patientId,
        careEpisodeId: careEpisodeId ?? created.careEpisodeId,
        caseId: created.id,
        transcript: body?.rawInput,
        actor,
        scopeKey,
        orchestrateAfterIntake: body?.orchestrateAfterIntake === true,
      }).catch((err) => ({
        available: isConductorFromIntakeEnabled(),
        enabled: isConductorFromIntakeEnabled(),
        ran: false as const,
        evaluationOnly: true as const,
        ehrWrite: false as const,
        reason: err instanceof Error ? err.message : "CONDUCTOR-from-intake failed",
      }));

      // P1 — open Front Desk booking work item with verified identity + care_episode_id.
      let intakeBookingHandoff: {
        workItemId: string | null;
        careEpisodeId: string | null;
        verifiedPatient: { id: string; name: string; dob: string } | null;
      } | null = null;
      if (patientId && (careEpisodeId ?? created.careEpisodeId)) {
        try {
          const { withDeskDirectory } = await import("@/lib/front-desk/directory");
          const { mutateState } = await import("@/lib/front-desk/store");
          const {
            openIntakeBookingWorkItem,
            verifiedPatientFromId,
          } = await import("@/lib/front-desk/intake-booking-handoff");
          const ep = careEpisodeId ?? created.careEpisodeId!;
          await withDeskDirectory(async () => {
            const verified = verifiedPatientFromId(patientId);
            if (!verified) return;
            const { result } = await mutateState((s) =>
              openIntakeBookingWorkItem(s, {
                careEpisodeId: ep,
                patientId,
                verifiedPatient: verified,
                intakeSummary: `${verified.name} · DOB ${verified.dob} · ${body?.rawInput?.slice(0, 120) || "intake"}`,
                reviewCaseId: created.id,
                reason: body?.rawInput?.slice(0, 200) ?? null,
              })
            );
            intakeBookingHandoff = {
              workItemId: result.id,
              careEpisodeId: ep,
              verifiedPatient: verified,
            };
          });
        } catch {
          intakeBookingHandoff = null;
        }
      }

      return NextResponse.json(
        {
          reviewCase: { ...created, careEpisodeId: careEpisodeId ?? created.careEpisodeId },
          careEpisodeId,
          conductorFromIntake,
          intakeBookingHandoff,
          ...extra,
        },
        { status: 201 }
      );
    }

    if (!isFastApiSynthesisEnabled()) {
      const reviewCase = createReviewCaseFromIntake(intakeArgs);
      if (patientId) reviewCase.patientId = patientId;
      const created = await createReviewCase(reviewCase, scopeKey, userId, tenant.practiceId);
      const careEpisodeId = await attachEpisode(created.id, created.patientLabel);
      if (careEpisodeId && created.careEpisodeId !== careEpisodeId) {
        created.careEpisodeId = careEpisodeId;
      }
      return withConductorOffer(created, careEpisodeId, { synthesisMode: "deterministic_synthetic" });
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
    if (patientId) reviewCase.patientId = patientId;

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
    const careEpisodeId = await attachEpisode(created.id, created.patientLabel);
    return withConductorOffer(created, careEpisodeId, { synthesisMode: "fastapi_rehearsal" });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
