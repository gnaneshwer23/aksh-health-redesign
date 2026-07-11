import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import {
  buildEmailVerificationUrl,
  createEmailVerificationToken,
  isEmailVerified,
  shouldSkipEmailSend,
} from "@/lib/auth/email-verification-repository";
import { sendEmail } from "@/lib/email/send";
import { reportError } from "@/lib/monitoring";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };
const GENERIC_MESSAGE = "If your account needs verification, we have sent a new verification email.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`resend-verification:${ip}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);

  if (!rate.success) {
    return rateLimitResponse(
      rate,
      "Too many verification email requests. Please try again later."
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alreadyVerified = await isEmailVerified(session.user.id);
    if (alreadyVerified) {
      return NextResponse.json({ ok: true, message: "Your email is already verified." });
    }

    if (shouldSkipEmailSend()) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const { token } = await createEmailVerificationToken(session.user.id);
    const verifyUrl = buildEmailVerificationUrl(token);

    const emailResult = await sendEmail({
      to: session.user.email,
      subject: "Verify your Aksh Health email address",
      text: [
        "Welcome to Aksh Health.",
        "",
        "Please verify your email address to secure your account:",
        verifyUrl,
        "",
        "This link expires in 24 hours. If you did not create an account, you can ignore this email.",
      ].join("\n"),
      html: [
        "<p>Welcome to Aksh Health.</p>",
        "<p>Please verify your email address to secure your account:</p>",
        `<p><a href="${verifyUrl}">Verify email address</a></p>`,
        "<p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>",
      ].join(""),
    });

    if (!emailResult.sent && process.env.NODE_ENV !== "production") {
      console.warn(`[email-verification] Dev verify link for ${session.user.email}: ${verifyUrl}`);
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    reportError(error, { route: "/api/auth/resend-verification", userId: session.user.id });
    const message = error instanceof Error ? error.message : "Failed to resend verification email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
