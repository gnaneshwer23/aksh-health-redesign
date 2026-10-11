import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { completeOnboarding } from "@/lib/auth/user-repository";
import { syncOnboardingConsentsToRegistry } from "@/lib/onboarding/consent-registry-sync";
import { clearOnboardingProgress } from "@/lib/onboarding/onboarding-progress-repository";
import { resolveOrganisationOdsCode } from "@/lib/onboarding/organisation-ods";
import { provisionSandbox } from "@/lib/network/sandbox";
import { setJoinedMemberName } from "@/lib/network/service";
import { resolvePatientBinding } from "@/lib/onboarding/patient-binding";
import { ROLES, type UserRole } from "@/lib/onboarding/roles";
import { isRealWorkspace, REAL_ROLES } from "@/lib/env/workspace";

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
  if (isRealWorkspace() && !REAL_ROLES.has(role)) {
    return NextResponse.json({ error: "This role is not available yet" }, { status: 400 });
  }

  const resolvedPracticeOds =
    practiceOds?.trim() ||
    resolveOrganisationOdsCode(organisation as Record<string, unknown> | undefined);

  // Server is authoritative for patient binding: re-check code + date of birth, never trust the client.
  const binding = role === "patient" ? await resolvePatientBinding(session.user.id, session.user.email, identity, { consume: true }) : null;
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

    // Professionals who completed the organisation step get their own sandbox organisation (admin), with sample
    // data when they chose the sandbox clinic. Failure must not block dashboard access.
    let sandbox: { organisationId: string; created: boolean } | null = null;
    // Staff who joined an existing organisation with an invite code are already members: no sandbox.
    const joined = typeof (organisation as Record<string, unknown> | undefined)?.joinedOrganisationId === "string";
    if (joined) {
      const name = fullName ?? (typeof identity?.fullName === "string" ? identity.fullName : null);
      if (name) {
        await setJoinedMemberName(session.user.id, String((organisation as Record<string, unknown>).joinedOrganisationId), name).catch((e) =>
          console.error("[onboarding] member name update failed", e instanceof Error ? e.message : e)
        );
      }
    }
    if (role !== "patient" && organisation && !joined && session.user.email) {
      try {
        const org = organisation as Record<string, unknown>;
        // The real workspace never seeds sample patients: every organisation starts empty under the name given.
        const real = isRealWorkspace();
        const described = org.useSynthetic === false || real;
        sandbox = await provisionSandbox(
          {
            userId: session.user.id,
            email: session.user.email,
            displayName: (fullName ?? (typeof identity?.fullName === "string" ? identity.fullName : null) ?? session.user.email).trim(),
            role,
          },
          {
            organisationName:
              described && typeof org.organisationName === "string" && org.organisationName.trim().length >= 2
                ? org.organisationName
                : real
                  ? "My clinic"
                  : undefined,
            withSampleData: !described,
          }
        );
      } catch (provisionError) {
        console.error("[onboarding] sandbox provisioning failed", provisionError instanceof Error ? provisionError.message : provisionError);
      }
    }

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
      sandboxOrganisationId: sandbox?.organisationId ?? null,
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
