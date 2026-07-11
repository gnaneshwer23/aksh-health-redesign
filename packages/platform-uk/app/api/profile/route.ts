import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";
import { buildUserProfile } from "../../../lib/profile/user-profile";
import { requireAuthenticatedUserScope } from "../../../lib/user-scope";

function resolveTestProfileFallback(request: Request) {
  if (process.env.AKSH_TEST_AUTH_HEADER !== "true" || process.env.NODE_ENV === "production") {
    return null;
  }

  const userId = request.headers.get("x-user-id")?.trim();
  if (!userId) return null;

  return {
    userId,
    email: request.headers.get("x-user-email")?.trim() || null,
    role: (request.headers.get("x-user-role")?.trim() || "gp") as Parameters<typeof buildUserProfile>[0]["role"],
    fullName: request.headers.get("x-user-name")?.trim() || null,
    organisation: request.headers.get("x-user-organisation")?.trim() || null,
    onboardingComplete: true,
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUserScope(request);
  if (auth.response) return auth.response;

  const testFallback = resolveTestProfileFallback(request);
  if (testFallback) {
    const profile = await buildUserProfile(testFallback);
    return NextResponse.json(profile);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await buildUserProfile({
    userId: session.user.id,
    email: session.user.email ?? null,
    role: session.user.role,
    fullName: session.user.name ?? null,
    organisation: session.user.organisation ?? null,
    onboardingComplete: session.user.onboardingComplete,
  });

  return NextResponse.json(profile);
}
