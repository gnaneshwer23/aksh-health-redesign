import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { role?: string };

  return NextResponse.json({
    ok: true,
    message: "Onboarding completion recorded (stub)",
    role: body.role ?? null,
    completedAt: new Date().toISOString(),
  });
}
