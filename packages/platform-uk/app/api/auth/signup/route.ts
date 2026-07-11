import { NextResponse } from "next/server";

import { signUpSchema } from "@/lib/auth/schemas";
import { createUserWithProfile, findUserByEmail } from "@/lib/auth/user-repository";
import { upsertOnboardingProgress } from "@/lib/onboarding/onboarding-progress-repository";
import { getRoleDefinition, SIGNUP_ROLE_MAP, type UserRole } from "@/lib/onboarding/roles";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = signUpSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid signup payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, role, fullName } = parsed.data;
  const mappedRole = (SIGNUP_ROLE_MAP[role] ?? role) as UserRole;

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const user = await createUserWithProfile({
      email,
      password,
      role: mappedRole,
      fullName,
    });

    const roleDef = getRoleDefinition(mappedRole);
    await upsertOnboardingProgress({
      userId: user.id,
      role: mappedRole,
      currentStep: 0,
      totalSteps: roleDef?.steps.length ?? null,
      completedSteps: [],
    });

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
