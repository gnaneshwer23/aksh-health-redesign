import { NextResponse } from "next/server";

import {
  consumeEmailVerificationToken,
  validateEmailVerificationToken,
} from "@/lib/auth/email-verification-repository";
import { reportError } from "@/lib/monitoring";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || "http://localhost:3000";
  const redirectBase = `${baseUrl.replace(/\/$/, "")}/verify-email`;

  if (!token) {
    return NextResponse.redirect(`${redirectBase}?status=pending`);
  }

  try {
    const existing = await validateEmailVerificationToken(token);

    if (existing.status === "expired") {
      return NextResponse.redirect(`${redirectBase}?status=expired`);
    }

    if (existing.status === "invalid") {
      return NextResponse.redirect(`${redirectBase}?status=expired`);
    }

    const result = await consumeEmailVerificationToken(token);

    if (result.status === "valid") {
      return NextResponse.redirect(`${redirectBase}?status=success`);
    }

    if (result.status === "expired") {
      return NextResponse.redirect(`${redirectBase}?status=expired`);
    }

    return NextResponse.redirect(`${redirectBase}?status=expired`);
  } catch (error) {
    reportError(error, { route: "/api/auth/verify-email" });
    return NextResponse.redirect(`${redirectBase}?status=expired`);
  }
}
