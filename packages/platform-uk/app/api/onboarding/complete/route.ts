import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { completeOnboarding } from "@/lib/auth/user-repository";
import { syncOnboardingConsentsToRegistry } from "@/lib/onboarding/consent-registry-sync";
import { clearOnboardingProgress } from "@/lib/onboarding/onboarding-progress-repository";
import { resolveOrganisationOdsCode } from "@/lib/onboarding/organisation-ods";
import { resolvePatientBinding } from "@/lib/onboarding/patient-binding";
import { ROLES, type UserRole } from "@/lib/onboarding/roles";

const roleValues = ROLES.map((role) => role.id) as [string, ...string[]];

const completeOnboardingSchema = z.object({
  role: z.enum(roleValues),
  fullName: z.string().trim().optional(),
  practiceOds: z.string().trim().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  identity: z.record(z.string(), z.unknown()).optional(),
  organisation: z.record(z.string(), z.unknown()).optional(),
  consents: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = completeOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { role, fullName, practiceOds, preferences, identity, organisation, consents } = parsed.data;

  const resolvedPracticeOds =
    practiceOds?.trim() ||
    resolveOrganisationOdsCode(organisation as Record<string, unknown> | undefined);

  // Server is authoritative for patient binding: re-check code + date of birth, never trust the client.
  const binding = role === "patient" ? await resolvePatientBinding(session.user.id, identity, { consume: true }) : null;
  const bindingPreferences =
    binding?.status === "linked"
      ? { boundPatientId: binding.patientId, networkPatientId: binding.patientId, boundOrganisationId: binding.organisationId, inviteStatus: "linked" }
      : binding
        ? { inviteStatus: binding.status === "none" ? "none" : "rejected" }
        : {};
  const market = typeof identity?.market === "string" ? identity.market : undefined;

  try {
    const profile = await completeOnboarding({
      userId: session.user.id,
      role: role as UserRole,
      fullName: fullName ?? (typeof identity?.fullName === "string" ? identity.fullName : null),
      practiceOds: resolvedPracticeOds,
      preferences: {
        ...(preferences ?? {}),
        ...bindingPreferences,
        ...(market ? { market } : {}),
        workspace: "synthetic",
        identity: identity ?? {},
        organisation: organisation ?? {},
        consents: consents ?? {},
      },
    });

    await clearOnboardingProgress(session.user.id);

    // Mirror onboarding checkboxes into the shared PH consent registry (same spine).
    // Failure here must not block dashboard access — profile is already complete.
    let consentRegistry: Awaited<ReturnType<typeof syncOnboardingConsentsToRegistry>> | null =
      null;
    try {
      const consentsRecord =
        consents && typeof consents === "object"
          ? (consents as Record<string, unknown>)
          : {};
      consentRegistry = await syncOnboardingConsentsToRegistry({
        role: role as UserRole,
        userId: session.user.id,
        consents: consentsRecord,
        actor: session.user.email ?? session.user.id,
        scopeKey: session.user.id,
      });
    } catch (syncError) {
      console.error("[onboarding] consent registry sync failed", syncError);
    }

    return NextResponse.json({
      ok: true,
      role: profile.role,
      onboardingComplete: profile.onboardingComplete,
      patientBinding: binding?.status ?? null,
      completedAt: new Date().toISOString(),
      consentRegistry: consentRegistry
        ? {
            subjectId: consentRegistry.subjectId,
            grantsCreated: consentRegistry.grantsCreated,
            purposes: consentRegistry.purposes,
            ehrWrite: false as const,
          }
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete onboarding";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
