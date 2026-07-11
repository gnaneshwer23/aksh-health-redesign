import { NextResponse } from "next/server";

import { consumePasswordResetToken } from "@/lib/auth/password-reset-repository";
import { resetPasswordSchema } from "@/lib/auth/password-reset-schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  try {
    const updated = await consumePasswordResetToken(token, password);

    if (!updated) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, message: "Your password has been updated. You can now sign in." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
