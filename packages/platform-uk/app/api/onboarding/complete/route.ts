import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { completeOnboarding } from "@/lib/auth/user-repository";
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

  try {
    const profile = await completeOnboarding({
      userId: session.user.id,
      role: role as UserRole,
      fullName: fullName ?? (typeof identity?.fullName === "string" ? identity.fullName : null),
      practiceOds: practiceOds ?? (typeof organisation?.odsCode === "string" ? organisation.odsCode : null),
      preferences: {
        ...(preferences ?? {}),
        identity: identity ?? {},
        organisation: organisation ?? {},
        consents: consents ?? {},
      },
    });

    return NextResponse.json({
      ok: true,
      role: profile.role,
      onboardingComplete: profile.onboardingComplete,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete onboarding";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
