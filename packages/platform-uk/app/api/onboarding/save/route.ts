import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { upsertOnboardingProgress, type UpsertOnboardingProgressInput } from "@/lib/onboarding/onboarding-progress-repository";
import { ROLES, type UserRole } from "@/lib/onboarding/roles";

const roleValues = ROLES.map((role) => role.id) as [string, ...string[]];

const saveOnboardingSchema = z.object({
  role: z.enum(roleValues).nullable().optional(),
  currentStep: z.number().int().min(0).optional(),
  totalSteps: z.number().int().min(0).nullable().optional(),
  identity: z.record(z.string(), z.unknown()).optional(),
  organisation: z.record(z.string(), z.unknown()).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  consents: z.record(z.string(), z.unknown()).optional(),
  tutorialScreen: z.number().int().min(0).optional(),
  completedSteps: z.array(z.number().int().min(0)).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = saveOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const record = await upsertOnboardingProgress({
      userId: session.user.id,
      role: (parsed.data.role as UserRole | null | undefined) ?? undefined,
      currentStep: parsed.data.currentStep,
      totalSteps: parsed.data.totalSteps,
      identity: parsed.data.identity as UpsertOnboardingProgressInput["identity"],
      organisation: parsed.data.organisation as UpsertOnboardingProgressInput["organisation"],
      preferences: parsed.data.preferences as UpsertOnboardingProgressInput["preferences"],
      consents: parsed.data.consents as UpsertOnboardingProgressInput["consents"],
      tutorialScreen: parsed.data.tutorialScreen,
      completedSteps: parsed.data.completedSteps,
    });

    return NextResponse.json({
      ok: true,
      savedAt: record.savedAt,
      currentStep: record.currentStep,
      role: record.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save onboarding progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
