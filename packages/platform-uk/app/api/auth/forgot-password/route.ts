import { NextResponse } from "next/server";

import {
  buildPasswordResetUrl,
  createPasswordResetToken,
} from "@/lib/auth/password-reset-repository";
import { forgotPasswordSchema } from "@/lib/auth/password-reset-schemas";
import { enforceForgotPasswordRateLimit } from "@/lib/auth/rate-limit-guards";
import { findUserByEmail } from "@/lib/auth/user-repository";
import { sendEmail } from "@/lib/email/send";
import { reportError } from "@/lib/monitoring";

const GENERIC_MESSAGE =
  "If an account exists for that email address, we have sent password reset instructions.";

export async function POST(request: Request) {
  const rateLimited = enforceForgotPasswordRateLimit(request);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => ({}));
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const user = await findUserByEmail(email);

    if (user) {
      const { token } = await createPasswordResetToken(user.id);
      const resetUrl = buildPasswordResetUrl(token);

      const emailResult = await sendEmail({
        to: email,
        subject: "Reset your Aksh Health password",
        text: [
          "You requested a password reset for your Aksh Health account.",
          "",
          `Reset your password: ${resetUrl}`,
          "",
          "This link expires in one hour. If you did not request this, you can ignore this email.",
        ].join("\n"),
        html: [
          "<p>You requested a password reset for your Aksh Health account.</p>",
          `<p><a href="${resetUrl}">Reset your password</a></p>`,
          "<p>This link expires in one hour. If you did not request this, you can ignore this email.</p>",
        ].join(""),
      });

      if (!emailResult.sent && process.env.NODE_ENV !== "production") {
        console.warn(`[password-reset] Dev reset link for ${email}: ${resetUrl}`);
      }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    reportError(error, { route: "/api/auth/forgot-password" });
    const message = error instanceof Error ? error.message : "Failed to process password reset request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
