import { NextResponse } from "next/server";

import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  markEmailVerified,
  shouldSkipEmailSend,
} from "@/lib/auth/email-verification-repository";
import { enforceSignupRateLimit } from "@/lib/auth/rate-limit-guards";
import { isSimulationRequest } from "@/lib/env/simulation";
import { signUpSchema } from "@/lib/auth/schemas";
import { createUserWithProfile, findUserByEmail } from "@/lib/auth/user-repository";
import { sendEmail } from "@/lib/email/send";
import { reportError } from "@/lib/monitoring";
import { upsertOnboardingProgress } from "@/lib/onboarding/onboarding-progress-repository";
import { getRoleDefinition, SIGNUP_ROLE_MAP, type UserRole } from "@/lib/onboarding/roles";

export async function POST(request: Request) {
  const rateLimited = await enforceSignupRateLimit(request);
  if (rateLimited) return rateLimited;

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

    // Scenario-runner accounts use reserved .example addresses: never send them email.
    if (shouldSkipEmailSend() || isSimulationRequest(request)) {
      await markEmailVerified(user.id);
    } else {
      try {
        const { token } = await createEmailVerificationToken(user.id);
        const verifyUrl = buildEmailVerificationUrl(token);

        const emailResult = await sendEmail({
          to: email,
          subject: "Verify your Aksh Health email address",
          text: [
            "Welcome to Aksh Health.",
            "",
            "Please verify your email address to secure your account:",
            verifyUrl,
            "",
            "This link expires in 24 hours. You can continue onboarding while you verify.",
          ].join("\n"),
          html: [
            "<p>Welcome to Aksh Health.</p>",
            "<p>Please verify your email address to secure your account:</p>",
            `<p><a href="${verifyUrl}">Verify email address</a></p>`,
            "<p>This link expires in 24 hours. You can continue onboarding while you verify.</p>",
          ].join(""),
        });

        if (!emailResult.sent && process.env.NODE_ENV !== "production") {
          console.warn(`[email-verification] Dev verify link for ${email}: ${verifyUrl}`);
        }
      } catch (emailError) {
        reportError(emailError, { route: "/api/auth/signup", userId: user.id });
      }
    }

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
