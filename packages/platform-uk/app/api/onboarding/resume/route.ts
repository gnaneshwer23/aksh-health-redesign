import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getOnboardingProgress } from "@/lib/onboarding/onboarding-progress-repository";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await getOnboardingProgress(session.user.id);
    if (!record) {
      return NextResponse.json({ error: "No saved onboarding progress" }, { status: 404 });
    }

    return NextResponse.json({
      role: record.role,
      currentStep: record.currentStep,
      totalSteps: record.totalSteps,
      identity: record.identity,
      organisation: record.organisation,
      preferences: record.preferences,
      consents: record.consents,
      tutorialScreen: record.tutorialScreen,
      completedSteps: record.completedSteps,
      savedAt: record.savedAt,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load onboarding progress";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
